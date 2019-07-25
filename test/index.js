"use strict";

var chai = require("chai"),
  expect = chai.expect,
  util = require("util"),
  proxyquire = require("proxyquire"),
  EventEmitter = require("events").EventEmitter;

chai.use(require("chai-as-promised"));

describe("obd-serial-connection", function() {
  var con = null;

  function getDummyCon(err) {
    return proxyquire("../index.js", {
      serialport: (function() {
        function SerialPort() {
          EventEmitter.call(this);

          setTimeout(
            function() {
              if (err) {
                this.emit("error", new Error("fake error"));
              } else {
                this.emit("open");
              }
            }.bind(this)
          );
        }
        util.inherits(SerialPort, EventEmitter);

        return SerialPort;
      })()
    });
  }

  beforeEach(function() {
    con = require("../index.js");
  });

  it("should export logger variables", function() {
    expect(con.logger).to.be.defined;
    expect(con.fhlog).to.be.defined;
  });

  it("should export a function", function() {
    expect(con).to.be.a("function");
  });

  it("should throw an assertion error", function() {
    expect(con.bind(con)).to.throw(
      "an options object must be provided to obd-serial-connection"
    );
  });

  it("should throw an assertion error", function() {
    expect(
      con.bind(con, {
        serialPath: "dev/some-path"
      })
    ).to.throw(
      "opts.serialOpts should be an Object provided to obd-serial-connection"
    );
  });

  it("should return a function", function() {
    expect(
      con({
        serialPath: "dev/some-path",
        serialOpts: {}
      })
    ).to.be.a("function");
  });

  it("should return a promise and resolve successfully", function() {
    con = getDummyCon(false);

    function configureFn() {
      return new Promise(function(resolve, reject) {
        setTimeout(resolve, 0);
      });
    }

    return con({
      serialPath: "dev/some-path",
      serialOpts: {}
    })(configureFn).then(function(conn) {
      expect(conn).to.be.an("object");
      expect(conn.ready).to.be.true;
      expect(conn).to.have.property("_events");
    });
  });

  it("should return a promise and reject with connection error", function() {
    con = getDummyCon(true);

    function configureFn() {
      return new Promise(function(resolve, reject) {
        setTimeout(resolve, 0);
      });
    }

    var p = con({
      serialPath: "dev/some-path",
      serialOpts: {}
    })(configureFn);

    return expect(p).to.be.eventually.rejectedWith("fake error");
  });
});
