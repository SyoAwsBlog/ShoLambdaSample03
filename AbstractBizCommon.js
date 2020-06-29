/*
開発プロジェクトに共通処理な処理などを、この層に実装する。

自分がLambdaを作成する時には、毎回実装するであろう便利関数などを実装する。
・時間系の関数など

written by syo
http://awsblog.physalisgp02.com
*/
module.exports = function AbstractBizCommon() {
  // aa のPromiseをグローバル変数へ
  var Promise;

  // 疑似的な継承関係として親モジュールを読み込む
  var superClazzFunc = require("./AbstractBaseCommon.js");
  // prototypeにセットする事で継承関係のように挙動させる
  AbstractBizCommon.prototype = new superClazzFunc();

  // 処理の実行
  function* executeBizCommon(event, context, bizRequireObjects) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# executeBizCommon : start");

      if (bizRequireObjects.PromiseObject) {
        Promise = bizRequireObjects.PromiseObject;
      }

      // 読み込みモジュールの引き渡し
      AbstractBizCommon.prototype.RequireObjects = bizRequireObjects;

      // 親の業務処理を実行
      return yield AbstractBizCommon.prototype.executeBaseCommon(
        event,
        context,
        bizRequireObjects
      );
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# executeBizCommon : end");
    }
  }
  AbstractBizCommon.prototype.executeBizCommon = executeBizCommon;

  /*
  どのリージョンでは日本時刻の日付（9時間差）の日付オブジェクトを返却する
  明示的に時差を引数で渡すことも可能

  @param offset 時差（[0-9]{3}）
  */
  AbstractBizCommon.prototype.getCurrentDate = function (offset) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# getCurrentDate : start");

      Date.prototype.setTimezone = function (tz) {
        var utc = new Date(
          this.getTime() + this.getTimezoneOffset() * 60 * 1000
        );
        return new Date(utc.getTime() + (tz / 100) * 60 * 60 * 1000);
      };

      var now = new Date();
      if (typeof offset == "undefined") {
        now = now.setTimezone(900);
      } else {
        now = now.setTimezone(offset);
      }

      return now;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# getCurrentDate : end");
    }
  };

  /*
  日付オブジェクトから、ISO8601形式の文字列に変換する

  @param now Dateオブジェクト
  */
  AbstractBizCommon.prototype.getTimeStringJst9 = function (now) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# getTimeStringJst9 : start");

      var year = now.getYear();
      var month = ("0" + (now.getMonth() + 1)).slice(-2);
      var day = ("0" + now.getDate()).slice(-2);
      var hour = ("0" + now.getHours()).slice(-2);
      var min = ("0" + now.getMinutes()).slice(-2);
      var sec = ("0" + now.getSeconds()).slice(-2);
      var mirisec = ("00" + now.getMilliseconds()).slice(-3);
      if (year < 2000) {
        year += 1900;
      }
      var dateStr =
        year +
        "-" +
        month +
        "-" +
        day +
        "T" +
        hour +
        ":" +
        min +
        ":" +
        sec +
        "." +
        mirisec +
        "+0900";

      return dateStr;

      return now;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# getTimeStringJst9 : end");
    }
  };

  /*
  業務前処理：実装してあるが抽象メソッド扱い
  オーバーライドして利用してください。

  @param arg 実行結果配列（最初の処理は、Lambdaの起動引数：event)
  */
  AbstractBizCommon.prototype.beforeMainExecute = function (args) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# beforeMainExecute :start");

      return new Promise(function (resolve, reject) {
        resolve("beforeMainExecute Finish");
      });
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# beforeMainExecute :end");
    }
  };

  /*
  業務メイン処理：実装してあるが抽象メソッド扱い
  オーバーライドして利用してください。

  @param arg 実行結果配列（最初の処理は、Lambdaの起動引数：event)
  */
  AbstractBizCommon.prototype.businessMainExecute = function (args) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# businessMainExecute :start");

      return new Promise(function (resolve, reject) {
        resolve("businessMainExecute Finish");
      });
    } catch (err) {
      if (base.getLogLevelError() >= base.getLogLevelCurrent()) {
        base.printStackTrace(err);
      }
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# businessMainExecute :end");
    }
  };

  /*
  業務後処理：実装してあるが抽象メソッド扱い
  オーバーライドして利用してください。

  @param arg 実行結果配列（最初の処理は、Lambdaの起動引数：event)
  */
  AbstractBizCommon.prototype.afterMainExecute = function (args) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# afterMainExecute :start");

      return new Promise(function (resolve, reject) {
        resolve("afterMainExecute Finish");
      });
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# afterMainExecute :end");
    }
  };

  /*
  順次処理する関数を指定する。
  Promiseを返却すると、Promiseの終了を待った上で順次処理をする
  
  順次処理を増やしたい時などは、オーバーライドする事で実装する。

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  */
  AbstractBizCommon.prototype.getTasks = function (event, context) {
    var base = AbstractBizCommon.prototype;
    try {
      base.writeLogTrace("AbstractBizCommon# getTasks :start");

      return [
        this.beforeMainExecute,
        this.businessMainExecute,
        this.afterMainExecute,
      ];
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizCommon# getTasks :end");
    }
  };

  return {
    executeBizCommon,
    AbstractBaseCommon: AbstractBizCommon.prototype,
  };
};
