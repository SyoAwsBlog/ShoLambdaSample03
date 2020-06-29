/*
業務毎（機能枚）に共通処理な処理などを、この層に実装する。

例えば
・API Gateway から呼び出すLambdaに共通
・SQSを呼び出すLambdaに共通
など、用途毎に共通となるような処理は、この層に実装すると良い

written by syo
http://awsblog.physalisgp02.com
*/
module.exports = function AbstractBizDynamoPutCommon() {
  // 疑似的な継承関係として親モジュールを読み込む
  var superClazzFunc = require("./AbstractBizCommon");
  // prototypeにセットする事で継承関係のように挙動させる
  AbstractBizDynamoPutCommon.prototype = new superClazzFunc();

  // テーブル名を環境変数から取得
  var TABLE_NAME = "";
  if (process && process.env && process.env.TableName) {
    TABLE_NAME = process.env.TableName;
  }

  // レコード保存期間の自動計算用（0より大きい値の時にセットされる）
  var TTL_TABLE_PERIOD = "0";
  if (process && process.env && process.env.TtlTablePeriod) {
    TTL_TABLE_PERIOD = process.env.TtlTablePeriod;
  }

  // 処理の実行
  function* executeBizUnitCommon(event, context, bizRequireObjects) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# executeBizUnitCommon : start"
      );

      // 自動再実行ようの演算
      var reCallCount = event.reCallCount || 0;
      reCallCount += 1;
      event.reCallCount = reCallCount;

      // 読み込みモジュールの引き渡し
      AbstractBizDynamoPutCommon.prototype.RequireObjects = bizRequireObjects;

      // 親の業務処理を実行
      return yield AbstractBizDynamoPutCommon.prototype.executeBizCommon(
        event,
        context,
        bizRequireObjects
      );
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# executeBizUnitCommon : end"
      );
    }
  }
  AbstractBizDynamoPutCommon.prototype.executeBizUnitCommon = executeBizUnitCommon;

  /*
  テーブル名を返却する
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.getTableName = function () {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace("AbstractBizDynamoPutCommon# getTableName : start");

      return TABLE_NAME;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizDynamoPutCommon# getTableName : end");
    }
  }.bind(AbstractBizDynamoPutCommon);

  /*
  TTL保存期間（日数）を返却する
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.getTtlTablePeriod = function () {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# getTtlTablePeriod : start"
      );

      return TTL_TABLE_PERIOD;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizDynamoPutCommon# getTtlTablePeriod : end");
    }
  }.bind(AbstractBizDynamoPutCommon);
  /*
  パラメータ引き取り処理

  API Gatewayからの呼び出しなど、Lambda実行引数を、後続処理で呼び出しやすくする為に、
  初期処理で返却しておく事で、getFirstIndexObjectで取得できるようになる。

  @override
  @param args 各処理の結果を格納した配列
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.initEventParameter = function (
    args
  ) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# initEventParameter : start"
      );

      // tasksの先頭には event が格納されてくる。
      // 後続のtaskで参照しやすくするには、最初のタスクで
      // eventを返却しておくと良い
      var event = args;

      // JSON形式でClientへ戻す情報を生成（サンプルは固定値）
      // NGで初期化しておき、最終的にPUTに成功したら置き換えることで、
      // クライアント側で処理判断
      event.ResponseObject = { ClientRetrun: "NG" };

      return event;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# initEventParameter : end"
      );
    }
  }.bind(AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon);

  /*
  DynamoDB登録内容のカスタマイズ用（オーバーライド）

  @param event API-Gatewayからの起動パラメータ
  @param dynamoRequest 基底処理で生成したDynamoDB登録パラメータの素体
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.getDynamoDbRequestParamMapping = function (
    event,
    dynamoRequest
  ) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# getDynamoDbRequestParamMapping : start"
      );
      return dynamoRequest;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# getDynamoDbRequestParamMapping : end"
      );
    }
  };

  /*
  業務前処理

  DynamoDBへの項目移送＆項目編集をする

  @override
  @param args 各処理の結果を格納した配列
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.beforeMainExecute = function (
    args
  ) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# beforeMainExecute : start"
      );

      // API Gatewayからの引数
      var event = base.getFirstIndexObject(args);

      var tableName = base.getTableName();
      var ttlTablePeriod = Number(base.getTtlTablePeriod());

      // DynamoDBへのリクエストを生成
      var dynamoRequest = {};
      dynamoRequest.TableName = tableName;
      dynamoRequest.Item = {};

      // TTLの設定
      if (ttlTablePeriod > 0) {
        var now = base.getCurrentDate();
        now.setDate(now.getDate() + ttlTablePeriod);
        var ttlTimestamp = String(Math.round(now.getTime() / 1000));
        dynamoRequest.Item.TimeToLiveAttr = { N: ttlTimestamp };
      }

      dynamoRequest = base.getDynamoDbRequestParamMapping(event, dynamoRequest);

      base.writeLogTrace(JSON.stringify(dynamoRequest, null, 2));

      return new Promise(function (resolve, reject) {
        resolve(dynamoRequest);
      });
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizDynamoPutCommon# beforeMainExecute : end");
    }
  }.bind(AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon);

  /*
  業務メイン処理

  DynamoDBへのput処理を実行する

  @override
  @param args 各処理の結果を格納した配列
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.businessMainExecute = function (
    args
  ) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# businessMainExecute : start"
      );

      // API Gatewayからの引数
      var event = base.getFirstIndexObject(args);

      // 直近のPromise処理の結果（DynamoDBへの登録情報）
      var dynamoRequest = base.getLastIndexObject(args);

      return new Promise(function (resolve, reject) {
        base.RequireObjects.Dynamo.putItem(dynamoRequest, function (
          dynamoErr,
          result
        ) {
          if (dynamoErr) {
            base.writeLogWarn(JSON.stringify(result, null, 2));
            base.writeLogWarn("DynamoDB PUT Error");
            base.printStackTrace(dynamoErr);
            reject(dynamoErr);
          } else {
            base.writeLogInfo("DynamoDB PUT Success");
            base.writeLogTrace(JSON.stringify(result, null, 2));
            resolve(result);
          }
        });
      });
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# businessMainExecute : end"
      );
    }
  }.bind(AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon);

  /*
  業務後処理

  ブラウザへの戻り値整形をする

  @override
  @param args 各処理の結果を格納した配列
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.afterMainExecute = function (
    args
  ) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "AbstractBizDynamoPutCommon# afterMainExecute : start"
      );

      // API Gatewayからの引数
      var event = base.getFirstIndexObject(args);

      // 直近のPromise処理の結果（DynamoDBへのPut処理結果）
      var dynamoResult = base.getLastIndexObject(args);

      // JSON形式でClientへ戻す情報をOKで上書き
      event.ResponseObject = { ClientRetrun: "OK" };

      return new Promise(function (resolve, reject) {
        resolve("afterMainExecute Finish");
      });
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizDynamoPutCommon# afterMainExecute : end");
    }
  }.bind(AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon);

  /*
  順次処理する関数を指定する。
  Promiseを返却すると、Promiseの終了を待った上で順次処理をする
  
  initEventParameter ・・・ API Gatewayからのパラメータを返却
  beforeMainExecute ・・・ DynamoDBに登録する為の項目マッピング
  businessMainExecute ・・・ DynamoDBへのput処理実行
  afterMainExecute ・・・ ブラウザへの戻り値を整形

  @param event Lambdaの起動引数：event
  @param context Lambdaの起動引数：context
  */
  AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon.getTasks = function (
    event,
    context
  ) {
    var base = AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace("AbstractBizDynamoPutCommon# getTasks :start");

      return [
        base.initEventParameter,
        base.beforeMainExecute,
        base.businessMainExecute,
        base.afterMainExecute,
      ];
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("AbstractBizDynamoPutCommon# getTasks :end");
    }
  };

  return {
    executeBizUnitCommon,
    AbstractBizDynamoPutCommon,
    AbstractBizCommon: AbstractBizDynamoPutCommon.prototype,
    AbstractBaseCommon: AbstractBizDynamoPutCommon.prototype.AbstractBaseCommon,
  };
};
