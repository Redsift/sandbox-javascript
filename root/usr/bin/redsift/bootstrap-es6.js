/* global Buffer */
/* global process */
/*jslint node: true */
"use strict";

// Provides bootstrapping for the to be launched nodes
const Nano = require('nanomsg');
const FS = require('fs');
const path = require('path');

function flattenNestedArrays(value) {
	if (Array.isArray(value)) {
		if (value.length === 1 && Array.isArray(value[0])) {
			return flattenNestedArrays(value[0]);
		}
		return value;
	} 
	return [ value ];
}

function fromEncodedMessage(body) {
	if ('in' in body) {
		body.in.data.forEach(function (i) {
			if (i.value) {
				var str = new Buffer(i.value, 'base64').toString('utf8');
				i.value = str;
			}
		});
	}
	
	if ('with' in body) {
		body.with.data.forEach(function (i) {
			if (i.value) {
				var str = new Buffer(i.value, 'base64').toString('utf8');
				i.value = str;
			}
		});
	}
	
	return body;
}

function toEncodedMessage(body) {
	body.forEach(function (i) {
		if (i.value) {
            // Encode the data struct as base64
            var str = JSON.stringify(i.value);
            i.value = new Buffer(str).toString('base64');
        }
	});
}

if (process.argv.length < 3) {
    throw new Error('No nodes to execute');
}

// -------- Main

const SIFT_ROOT = process.env.SIFT_ROOT;
const IPC_ROOT = process.env.IPC_ROOT;
const TEST = (process.env.TEST === 'true');

if (!SIFT_ROOT) {
	throw new Error('Environment SIFT_ROOT not set');
}

if (!IPC_ROOT) {
	throw new Error('Environment IPC_ROOT not set');
}

if (TEST) {
	console.log('Unit Test Mode');
}

const nodes = process.argv.slice(2);

const sift = JSON.parse(FS.readFileSync(path.join(SIFT_ROOT, 'sift.json'), 'utf8'));

if ((sift.dag === undefined) || (sift.dag.nodes === undefined)) {
	throw new Error('Sift does not contain any nodes');
}

var one = false;
nodes.forEach(function (i) {
	const n = sift.dag.nodes[i];
	
	if (n === undefined || n.implementation === undefined || n.implementation.javascript === undefined) {
		throw new Error('implementation not supported by boostrap at node #' + i);
	}
	
	one = true;
	const node = require(path.join(SIFT_ROOT, n.implementation.javascript));
	if (TEST) {
		return;
	}
	const reply = Nano.socket('rep');
	reply.connect('ipc://' + path.join(IPC_ROOT, i + '.sock'));
	reply.on('data', function (msg) {
		let req = fromEncodedMessage(JSON.parse(msg));
		// console.log('REQ:', req);
		const start = process.hrtime();
		let rep = node(req);
		// console.log('REP:', rep);
		if (!Array.isArray(rep)) {
			// coerce into an array
			rep = [ rep ];
		}
		Promise.all(rep)
			.then(function (value) {
				const diff = process.hrtime(start);
				// if node() returns a Promise.all([...]), remove the nesting
				let flat = toEncodedMessage(flattenNestedArrays(value));
				reply.send(JSON.stringify({ out: flat, stats: { result: diff }}));
			})
			.catch(function (error) {
				const diff = process.hrtime(start);
				reply.send(JSON.stringify({ error: error, stats: { result: diff }}));
				console.error(error);
			});
	});
});

if (!one) {
	throw new Error('No javascript implementations');
}
