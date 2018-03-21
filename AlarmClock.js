'use strict';

const AWS = require("aws-sdk");
const cloudWatchEvents = new AWS.CloudWatchEvents();
const ruleName = "A-CloudWatchRule-from-a-Lambda";
const targetId = "target-trigger-alarm";

module.exports.set = (event, context, callback) => {
    
    const params = {
        Name: ruleName,
        Description: "The best description ever",
        ScheduleExpression: "rate(1 minute)",
        State: "ENABLED"
    };
    
    cloudWatchEvents.putRule(params, function(error, data) {
        if (error) {
            console.error(error, error.stack);
            callback(null, {
                statusCode: 500,
                body: 'Cannot set Alarm',
            });
        } else {
            console.log(data);

            const targetParams = {
                Rule: ruleName,
                Targets: [
                    {
                        Id: targetId,
                        Arn: process.env.TARGET_ARN
                    }
                ]
            };

            cloudWatchEvents.putTargets(targetParams, function(error, data) {
                if (error) {
                    console.error(error, error.stack);
                    callback(null, {
                        statusCode: 500,
                        body: 'Cannot set Target to Alarm',
                    });
                } else {
                    callback(null, {
                        statusCode: 200,
                        body: '',
                    });
                }
                
            });
        }
    });
  
};

module.exports.alarm = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'ALARM!',
            event: event,
            context: context
        }),
    };
    
    console.log(response);

    const removeTargetsParams = {
        Ids: [targetId],
        Rule: ruleName
    }
    cloudWatchEvents.removeTargets(removeTargetsParams, function(error, data) {
        if (error) {
            console.log(error, error.stack);
        } else {

            const deleteRuleParams = {
                Name: ruleName
            };
            cloudWatchEvents.deleteRule(deleteRuleParams, function(error, data) {
                if (error) {
                    console.log(error, error.stack);
                } else {
                    console.log(data);   
                    callback(response, "CloudWatch rule deleted", data);
                }
            });

        }
    });

};
