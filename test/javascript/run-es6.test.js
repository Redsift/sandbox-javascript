describe('run es6', () => {

  beforeEach(() => {
    jest.resetModules();
  });

  test('execute - no error thrown', () => {
    try {
      require('../../root/usr/bin/redsift/run-es6.js');
    } catch (e) {
      console.log(e);
      expect(true).toEqual(false);
    }
  });

  describe('dry run', () => {
    process.env.DRY = true;
    jest.spyOn(global.console, 'log')
    test('true', () => {
      require('../../root/usr/bin/redsift/run-es6.js');
      expect(console.log).toHaveBeenCalledWith('Detected Dry run');
    });
  });

  describe('detectCapnProtocol', () => {
    // Setting schema version 2
    process.env.SIFT_JSON = 'sift-schema2.json';
    const run = require('../../root/usr/bin/redsift/run-es6.js');
    test('true', () => {
      const req = {
        in: {
          bucket: 'api_scan',
          data: [{
            key: 'rstid:kerash:01DMN8M07XAMSDFE5FXGK1WZY8',
            value: 'aXBjZGF0YTM2NTE1OTEyNA==',
            epoch: 1568376750,
            generation: 0
          }]
        }
      };
      const result = run.detectCapnProtocol(req);
      expect(result).toEqual(true);
    });
    test('false', () => {
      const req = {
        in: {
          bucket: 'api_scan',
          data: [{
            key: 'rstid:tada:01DMN8M07XAMSDFE5FXGK1WZY8',
            value: 'aXBjZGF0YTM2NTE1OTEyNA==',
            epoch: 1568376750,
            generation: 0
          }]
        }
      };
      const result = run.detectCapnProtocol(req);
      expect(result).toEqual(false);
    });
    test('console.log error', () => {
      const req = {
        in: {
          data: [{
            key: 'bananas',
            bananas: 1234
          }]
        }
      };
      const result = run.detectCapnProtocol(req);
      expect(result).toEqual(false);
      expect(run.detectCapnProtocol).toThrow(TypeError);
    });
    test('no req.in.data', () => {
      const req = {
        in: {}
      };
      const result = run.detectCapnProtocol(req);
      expect(result).toEqual(false);
    });
  });

  describe('getRpcBucketNamesFromSift', () => {
    // Setting schema version 2
    process.env.SIFT_JSON = 'sift-schema2.json';
    const run = require('../../root/usr/bin/redsift/run-es6.js');
    test('get _rpc exports from sift json', () => {
      const rpcExportBuckets = run.getRpcBucketNamesFromSift();
      expect(rpcExportBuckets).toEqual({"api_rpc": true});
    });
  });

  describe('getRpcBucketNamesFromSift', () => {
    // Setting schema version 2
    process.env.SIFT_JSON = 'sift-schema2.json';
    const run = require('../../root/usr/bin/redsift/run-es6.js');
    test('get _rpc exports from sift json', () => {
      const rpcExportBuckets = run.getRpcBucketNamesFromSift();
      expect(rpcExportBuckets).toEqual({"api_rpc": true});
    });
  });

  describe('detectNodeRpcOutput', () => {
    const init = require('../../root/usr/bin/redsift/init.js');
    // Setting schema version 2
    process.env.SIFT_JSON = 'sift-schema2.json';
    const run = require('../../root/usr/bin/redsift/run-es6.js');
    test('detect isApiRpcOutput', () => {
      const rpcBucketNames = run.getRpcBucketNamesFromSift();
      const isApiRpcOutput = run.detectNodeRpcOutput(init.sift.dag.nodes[0].outputs, rpcBucketNames);
      expect(isApiRpcOutput).toEqual(true);
    });
  });
});