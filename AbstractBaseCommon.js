/*
基底処理の枠組みとして必要そうな処理を実装する
・ログのレベル毎出力
・Promiseの順次処理ハンドリング
・エラー発生時の自動再実行
・業務例外（Lambda関数のエラーとしない例外）

written by syo
http://awsblog.physalisgp02.com
*/
module.exports = function AbstractBaseCommon() {
  // aa のPromiseをグローバル変数へ
  var Promise;
  // aa をグローバル変数へ
  var aa;
  // AWS SDK をグローバル変数へ
  var Aws;

  // 各ログレベルの宣言
  var LOG_LEVEL_TRACE = 1;
  var LOG_LEVEL_DEBUG = 2;
  var LOG_LEVEL_INFO = 3;
  var LOG_LEVEL_WARN = 4;
  var LOG_LEVEL_ERROR = 5;

  // 現在の出力レベルを設定
  var LOG_LEVEL_CURRENT = LOG_LEVEL_INFO;
  if (process && process.env && process.env.LogLevel) {
    LOG_LEVEL_CURRENT = process.env.LogLevel;
  }

  // 業務用例外の宣言
  function BizError(err, message) {
    this.name = "WarnInterruption";
    this.message = message || "SequenceTasks Interruption";
    this.stack = err.stack;
  }
  BizError.prototype = Object.create(Error.prototype);
  BizError.prototype.constructor = BizError;

  // 現在のログレベルの値を返却する
  AbstractBaseCommon.prototype.getLogLevelCurrent = function () {
    return LOG_LEVEL_CURRENT;
  }.bind(AbstractBaseCommon.prototype);

  // 定数としての各ログレベルを返却する
  AbstractBaseCommon.prototype.getLogLevelTrace = function () {
    return LOG_LEVEL_TRACE;
  }.bind(AbstractBaseCommon.prototype);
  AbstractBaseCommon.prototype.getLogLevelDebug = function () {
    return LOG_LEVEL_DEBUG;
  }.bind(AbstractBaseCommon.prototype);
  AbstractBaseCommon.prototype.getLogLevelInfo = function () {
    return LOG_LEVEL_INFO;
  }.bind(AbstractBaseCommon.prototype);
  AbstractBaseCommon.prototype.getLogLevelWarn = function () {
    return LOG_LEVEL_WARN;
  }.bind(AbstractBaseCommon.prototype);
  AbstractBaseCommon.prototype.getLogLevelError = function () {
    return LOG_LEVEL_ERROR;
  }.bind(AbstractBaseCommon.prototype);

  /*
  出力レベル毎のログ処理
  */
  AbstractBaseCommon.prototype.writeLogTrace = function (msg) {
    if (this.getLogLevelTrace() >= this.getLogLevelCurrent()) {
      console.log(msg);
    }
  }.bind(AbstractBaseCommon.prototype);

  AbstractBaseCommon.prototype.writeLogDebug = function (msg) {
    if (this.getLogLevelDebug() >= this.getLogLevelCurrent()) {
      console.log(msg);
    }
  }.bind(AbstractBaseCommon.prototype);

  AbstractBaseCommon.prototype.writeLogInfo = function (msg) {
    if (this.getLogLevelInfo() >= this.getLogLevelCurrent()) {
      console.log(msg);
    }
  }.bind(AbstractBaseCommon.prototype);

  AbstractBaseCommon.prototype.writeLogWarn = function (msg) {
    if (this.getLogLevelWarn() >= this.getLogLevelCurrent()) {
      console.log(msg);
    }
  }.bind(AbstractBaseCommon.prototype);

  AbstractBaseCommon.prototype.writeLogError = function (msg) {
    if (this.getLogLevelError() >= this.getLogLevelCurrent()) {
      console.log(msg);
    }
  }.bind(AbstractBaseCommon.prototype);

  /*
  業務例外以外のエラー情報を出力する  

  @param err Errorオブジェクト
  */
  AbstractBaseCommon.prototype.printStackTrace = function (err) {
    if (this.getLogLevelError() >= this.getLogLevelCurrent()) {
      if (err instanceof BizError) {
      } else if (err && err.name && err.name == "WarnInterruption") {
      } else if (err && err.errorType && err.errorType == "WarnInterruption") {
      } else {
        if (err.stack) {
          console.log(err.stack);
        } else {
          console.log(err.message, err);
        }
      }
    }
  }.bind(AbstractBaseCommon.prototype);

  /*
  業務例外かどうか判定する

  @param err Errorオブジェクト
  @return true:業務例外・false:例外
  */
  AbstractBaseCommon.prototype.judgeBizError = function (err) {
    var rtnFlag = false;
    if (err instanceof BizError) {
      rtnFlag = true;
    } else if (err && err.name && err.name == "WarnInterruption") {
      rtnFlag = true;
    } else if (err && err.errorType && err.errorType == "WarnInterruption") {
      rtnFlag = true;
    }
    return rtnFlag;
  }.bind(AbstractBaseCommon.prototype);

  /*
  業務例外を取得する（エラーオブジェクトをラップして業務例外にする）

  @param err エラーオブジェクト
  @param message エラーメッセージ
  */
  AbstractBaseCommon.prototype.getBizError = function (err, message) {
    return new BizError(err, message);
  }.bind(AbstractBaseCommon.prototype);

  /*
  メイン実行処理

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  */
  AbstractBaseCommon.prototype.executeBaseCommon = function* (event, context) {
    var currentThisClazz = this;
    try {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# executeBaseCommon : start"
      );

      // 読み込みモジュールをグローバル変数へ
      if (currentThisClazz.RequireObjects.PromiseObject) {
        Promise = currentThisClazz.RequireObjects.PromiseObject;
      }
      if (currentThisClazz.RequireObjects.aa) {
        aa = currentThisClazz.RequireObjects.aa;
      }
      if (currentThisClazz.RequireObjects.Aws) {
        Aws = currentThisClazz.RequireObjects.Aws;
      }

      // 各タスク処理で参照したであろう情報をクラス変数へ
      var promiseRefs = {
        event,
        context,
      };
      currentThisClazz.promiseRefs = promiseRefs;

      // 処理の戻り値用にPromise外に宣言
      var bizLastVal;

      return yield Promise.resolve()
        .then(function () {
          // getTasksで指定した Promise配列を取得
          var tasks = currentThisClazz.getTasks(event, context);

          currentThisClazz.writeLogDebug(
            "AbstractBaseCommon# Get Tasks After Task Count:" + tasks.length
          );

          // 順次実行処理を実装
          return currentThisClazz.sequenceTasks(currentThisClazz, tasks, event);
        })
        .then(function (results) {
          // 全てのタスクの後処理として実装する用に、オーバーライド用関数を呼ぶ
          bizLastVal = currentThisClazz.afterAllTasksExecute(
            event,
            context,
            results
          );
          return bizLastVal;
        })
        .catch(function (err) {
          try {
            // 処理中例外処理として何かを実装する用に、オーバーライド用関数を呼ぶ
            currentThisClazz.catchErrorAllTasksExecute(event, context, err);
          } catch (err) {
            throw err;
          }
        })
        .then(function () {
          // finallyで通る処理を実装する用に、オーバーライド用関数を呼ぶ
          currentThisClazz.finallyAllTasksExecute(event, context);
          return bizLastVal;
        });
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# executeBaseCommon : end"
      );
    }
  };

  /*
  引数で受け取ったPromise配列を順次処理する

  @param currentThisClazz AbstractBaseCommonの参照
  @param tasks 実行対象のPromise配列
  @param event Lamdbaの実行引数
  */
  AbstractBaseCommon.prototype.sequenceTasks = function (
    currentThisClazz,
    tasks,
    event
  ) {
    try {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# sequenceTasks : start"
      );

      return new Promise(function (resolve, reject) {
        function* controler() {
          function recordValue(results, value) {
            results.push(value);
            return results;
          }
          var results = [];
          var pushValue = recordValue.bind(null, results);

          var errFlag = new Boolean(false);

          var promise = Promise.resolve(event);

          for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];

            promise = promise
              .then(task)
              .then(pushValue)
              .catch(function (err) {
                if (err) {
                  if (errFlag == false) {
                    if (err instanceof BizError) {
                      console.log(err.message);
                    } else if (
                      err &&
                      err.name &&
                      err.name == "WarnInterruption"
                    ) {
                      console.log(err.message);
                    } else if (
                      err &&
                      err.errorType &&
                      err.errorType == "WarnInterruption"
                    ) {
                      console.log(err.message);
                    }

                    errFlag = new Boolean(true);

                    return Promise.reject(err);
                  } else {
                    // return Promise.reject();
                    throw err;
                  }
                } else {
                  // ありえない
                  // return Promise.reject();
                  throw new Error();
                }
              });
          }
          yield results;
          return yield promise;
        }

        currentThisClazz.RequireObjects.aa(
          controler(currentThisClazz, tasks, event)
        )
          .then(function (results) {
            resolve(results);
          })
          .catch(function (err) {
            reject(err);
          });
      });
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      currentThisClazz.writeLogTrace("AbstractBaseCommon# sequenceTasks : end");
    }
  };

  /*
  処理結果配列の最初の要素（参照）を返却する

  @param args 処理結果配列
  */
  AbstractBaseCommon.prototype.getFirstIndexObject = function (args) {
    var rtnObject = null;
    if (args && args.length > 0) {
      rtnObject = args[0];
    }
    return rtnObject;
  };

  /*
  処理結果配列の最後の要素（参照）を返却する

  @param args 処理結果配列
  */
  AbstractBaseCommon.prototype.getLastIndexObject = function (args) {
    var rtnObject = null;
    if (args && args.length > 0) {
      var lastIndexNum = args.length - 1;
      rtnObject = args[lastIndexNum];
    }
    return rtnObject;
  };

  /*
  順次処理する関数を指定する。
  Promiseを返却すると、Promiseの終了を待った上で順次処理をする
  
  順次処理を増やしたい時などは、オーバーライドする事で実装する。

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  */
  AbstractBaseCommon.prototype.getTasks = function (event, context) {
    var currentThisClazz = this;
    try {
      currentThisClazz.writeLogTrace("AbstractBaseCommon# getTasks : start");
      return [];
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      if (
        currentThisClazz.getLogLevelTrace() >=
        currentThisClazz.getLogLevelCurrent()
      ) {
        console.log("AbstractBaseCommon# getTasks : end");
      }
    }
  };

  /*
  順次処理した後の全ての処理が成功した場合の後処理を実装した場合にオーバーライドする

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  @param results 処理結果配列
  */
  AbstractBaseCommon.prototype.afterAllTasksExecute = function (
    event,
    context,
    results
  ) {
    var currentThisClazz = this;
    try {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# afterAllTasksExecute : start"
      );
      return "AbstractBaseCommon# afterAllTasksExecute:Finish";
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# afterAllTasksExecute : end"
      );
    }
  };

  /*
  成功・失敗に関わらず順次処理の後処理を実行したい場合にオーバーライドする

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  */
  AbstractBaseCommon.prototype.finallyAllTasksExecute = function (
    event,
    context
  ) {
    var currentThisClazz = this;
    try {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# finallyAllTasksExecute : start"
      );
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# finallyAllTasksExecute : end"
      );
    }
  };

  /*
  順次処理で何かしらの例外が発生した場合の処理を実装する
  例外が発生した場合にリトライ上限まで再実行するサンプルを実装する

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  @param err 発生例外
  */
  AbstractBaseCommon.prototype.catchErrorAllTasksExecute = function (
    event,
    context,
    err
  ) {
    var currentThisClazz = this;
    try {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# catchErrorAllTasksExecute : start"
      );

      if (
        currentThisClazz.getLogLevelError() >=
        currentThisClazz.getLogLevelCurrent()
      ) {
        if (err) {
          if (err instanceof BizError) {
            console.log(err.message);
          } else if (err && err.name && err.name == "WarnInterruption") {
            console.log(err.message);
          } else if (
            err &&
            err.errorType &&
            err.errorType == "WarnInterruption"
          ) {
            console.log(err.message);
          } else {
            currentThisClazz.printStackTrace(err);
          }
        }
      }

      if (err && !currentThisClazz.judgeBizError(err)) {
        var bizAutoRetryCount = 0;
        if (event && event.bizAutoRetryCount) {
          bizAutoRetryCount = event.bizAutoRetryCount;
        }

        var autoFunctionRetryMax = 0;
        if (process && process.env && process.env.autoFunctionRetry) {
          autoFunctionRetryMax = process.env.autoFunctionRetry;
        }

        if (bizAutoRetryCount < autoFunctionRetryMax) {
          currentThisClazz.writeLogWarn(
            "AbstractBaseCommon# autoRetryExecute bizAutoRetryCount:" +
              bizAutoRetryCount +
              " autoFunctionRetryMax:" +
              autoFunctionRetryMax
          );

          bizAutoRetryCount = bizAutoRetryCount + 1;
          event.bizAutoRetryCount = bizAutoRetryCount;

          currentThisClazz.autoRetryExecute(event, context, err);
        } else {
          throw err;
        }
      }
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# catchErrorAllTasksExecute : end"
      );
    }
  }.bind(AbstractBaseCommon.prototype);

  /*
  リトライ上限未満である場合、自Lambdaを同引数で再実行するサンプル

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  @param err 発生例外
  */
  AbstractBaseCommon.prototype.autoRetryExecute = function (
    event,
    context,
    err
  ) {
    var currentThisClazz = this;
    try {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# autoRetryExecute : start"
      );

      var autoFunctionRetryWait = 500;
      if (process && process.env && process.env.AutoFunctionRetryWait) {
        autoFunctionRetryWait = process.env.AutoFunctionRetryWait;
      }

      var autoFunctionRetryMax = 0;
      if (process && process.env && process.env.autoFunctionRetry) {
        autoFunctionRetryMax = process.env.autoFunctionRetry;
      }

      var funcName = process.env.AWS_LAMBDA_FUNCTION_NAME;

      var params = {
        FunctionName: funcName,
        InvokeArgs: JSON.stringify(event),
      };

      function sleep(msec, val) {
        return new Promise(function (resolve, reject) {
          setTimeout(resolve, msec, val);
        });
      }

      function lambdaExecute(params) {
        var Lambda = new Aws.Lambda({
          maxRetries: 5,
          httpOptions: {
            connectTimeout: 5000,
            timeout: 5000,
          },
        });

        return new Promise(function (resolve, reject) {
          Lambda.invokeAsync(params, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      }

      var irregularErr;
      function* main() {
        yield sleep(autoFunctionRetryWait, "Retry Sleep");
        yield lambdaExecute(params);
        return "Retry Execute";
      }

      aa(main())
        .then(function (val) {
          return val;
        })
        .catch(function (err) {
          if (
            currentThisClazz.getLogLevelError >=
            currentThisClazz.getLogLevelCurrent()
          ) {
            currentThisClazz.printStackTrace(err);
          }
          // リトライ中にエラーが出てもスローしない
        });
    } catch (err) {
      currentThisClazz.printStackTrace(err);
      throw err;
    } finally {
      currentThisClazz.writeLogTrace(
        "AbstractBaseCommon# autoRetryExecute : end"
      );
    }
  }.bind(AbstractBaseCommon.prototype);
};
