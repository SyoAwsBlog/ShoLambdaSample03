/*
処理固有に必要な処理などを、この層に実装する。

テストや挙動確認を含めたコードをコメントアウト込みで、
サンプルとして記述する。

written by syo
http://awsblog.physalisgp02.com
*/
module.exports = function SampleBizDynamoPutModule() {
  // 疑似的な継承関係として親モジュールを読み込む
  var superClazzFunc = new require("./AbstractBizDynamoPutCommon.js");
  // prototypeにセットする事で継承関係のように挙動させる
  SampleBizDynamoPutModule.prototype = new superClazzFunc();

  // 処理の実行
  function* execute(event, context, bizRequireObjects) {
    var base = SampleBizDynamoPutModule.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace("SampleBizDynamoPutModule# execute : start");

      // 親の業務処理を実行
      return yield SampleBizDynamoPutModule.prototype.executeBizUnitCommon(
        event,
        context,
        bizRequireObjects
      );
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace("SampleBizDynamoPutModule# execute : end");
    }
  }

  /*
  DynamoDB登録内容のカスタマイズ用（オーバーライド）

  @param event API-Gatewayからの起動パラメータ
  @param dynamoRequest 基底処理で生成したDynamoDB登録パラメータの素体
  */
  SampleBizDynamoPutModule.prototype.AbstractBaseCommon.getDynamoDbRequestParamMapping = function (
    event,
    dynamoRequest
  ) {
    var base = SampleBizDynamoPutModule.prototype.AbstractBaseCommon;
    try {
      base.writeLogTrace(
        "SampleBizDynamoPutModule# getDynamoDbRequestParamMapping : start"
      );

      var columnA = "XXXXX";
      var columnB = "YYYYY";
      var columnC = "ZZZZZ";
      if ("body-json" in event) {
        if ("TestColA" in event["body-json"]) {
          columnA = event["body-json"].TestColA;
        }
        if ("TestColB" in event["body-json"]) {
          columnB = event["body-json"].TestColB;
        }
        if ("TestColC" in event["body-json"]) {
          columnC = event["body-json"].TestColC;
        }
      }

      var timestamp = base.getTimeStringJst9(base.getCurrentDate());
      dynamoRequest.Item.SortKey = { S: timestamp };
      dynamoRequest.Item.PrimaryKey = { S: columnA };
      dynamoRequest.Item.ColumnB = { S: columnB };
      dynamoRequest.Item.ColumnC = { S: columnC };

      return dynamoRequest;
    } catch (err) {
      base.printStackTrace(err);
      throw err;
    } finally {
      base.writeLogTrace(
        "SampleBizDynamoPutModule# getDynamoDbRequestParamMapping : end"
      );
    }
  };

  return {
    execute,
  };
};
