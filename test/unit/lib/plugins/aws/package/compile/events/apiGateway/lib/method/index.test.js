'use strict';

const expect = require('chai').expect;
const AwsCompileApigEvents = require('../../../../../../../../../../../lib/plugins/aws/package/compile/events/apiGateway/index');
const Serverless = require('../../../../../../../../../../../lib/Serverless');
const AwsProvider = require('../../../../../../../../../../../lib/plugins/aws/provider');
const runServerless = require('../../../../../../../../../../utils/run-serverless');

describe('#compileMethods()', () => {
  let serverless;
  let awsCompileApigEvents;

  beforeEach(() => {
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    serverless = new Serverless({ commands: [], options: {} });
    serverless.setProvider('aws', new AwsProvider(serverless, options));
    serverless.service.service = 'first-service';
    serverless.service.provider.compiledCloudFormationTemplate = { Resources: {} };
    serverless.service.environment = {
      stages: {
        dev: {
          regions: {
            'us-east-1': {
              vars: {
                IamRoleLambdaExecution:
                  'arn:aws:iam::12345678:role/service-dev-IamRoleLambdaExecution-FOO12345678',
              },
            },
          },
        },
      },
    };
    serverless.service.functions.First = {};
    serverless.service.functions.Second = {};
    serverless.service.functions.Third = {};
    awsCompileApigEvents = new AwsCompileApigEvents(serverless, options);
    awsCompileApigEvents.validated = {};
    awsCompileApigEvents.apiGatewayMethodLogicalIds = [];
    awsCompileApigEvents.apiGatewayRestApiLogicalId = 'ApiGatewayRestApi';
    awsCompileApigEvents.apiGatewayResources = {
      'users/create': {
        name: 'UsersCreate',
        resourceLogicalId: 'ApiGatewayResourceUsersCreate',
      },

      'users/list': {
        name: 'UsersList',
        resourceLogicalId: 'ApiGatewayResourceUsersList',
      },
      'users/update': {
        name: 'UsersUpdate',
        resourceLogicalId: 'ApiGatewayResourceUsersUpdate',
      },
      'users/delete': {
        name: 'UsersDelete',
        resourceLogicalId: 'ApiGatewayResourceUsersDelete',
      },
    };
  });

  it('should have request parameters defined when they are set', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
          request: {
            parameters: {
              'method.request.querystring.foo': true,
              'method.request.querystring.bar': false,
              'method.request.header.foo': true,
              'method.request.header.bar': false,
              'method.request.path.foo': true,
              'method.request.path.bar': false,
            },
          },
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.header.foo']
    ).to.equal(true);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.header.bar']
    ).to.equal(false);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters[
        'method.request.querystring.foo'
      ]
    ).to.equal(true);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters[
        'method.request.querystring.bar'
      ]
    ).to.equal(false);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.path.foo']
    ).to.equal(true);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.path.bar']
    ).to.equal(false);
  });

  it('should not have integration RequestParameters when no request parameters are set', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration
    ).to.not.have.key('RequestParameters');
  });

  it('should create method resources when http events given', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
        },
      },
      {
        functionName: 'Second',
        http: {
          method: 'get',
          path: 'users/list',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Type
    ).to.equal('AWS::ApiGateway::Method');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Type
    ).to.equal('AWS::ApiGateway::Method');
  });

  it('should support AWS integration type', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
          request: {
            parameters: {
              'method.request.querystring.foo': true,
              'method.request.querystring.bar': false,
              'method.request.path.foo': true,
              'method.request.path.bar': false,
              'method.request.header.foo': true,
              'method.request.header.bar': false,
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Type
    ).to.equal('AWS');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestParameters
    ).to.deep.equal({
      'integration.request.querystring.foo': 'method.request.querystring.foo',
      'integration.request.querystring.bar': 'method.request.querystring.bar',
      'integration.request.path.foo': 'method.request.path.foo',
      'integration.request.path.bar': 'method.request.path.bar',
      'integration.request.header.foo': 'method.request.header.foo',
      'integration.request.header.bar': 'method.request.header.bar',
    });
  });

  it('should support AWS_PROXY integration type', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS_PROXY',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Type
    ).to.equal('AWS_PROXY');
  });

  it('should support HTTP integration type', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'HTTP',
          request: {
            uri: 'https://example.com',
            parameters: {
              'method.request.querystring.foo': true,
              'method.request.querystring.bar': false,
              'method.request.path.foo': true,
              'method.request.path.bar': false,
              'method.request.header.foo': true,
              'method.request.header.bar': false,
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Type
    ).to.equal('HTTP');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Uri
    ).to.equal('https://example.com');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.IntegrationHttpMethod
    ).to.equal('POST');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates
    ).to.equal(undefined);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestParameters
    ).to.deep.equal({
      'integration.request.querystring.foo': 'method.request.querystring.foo',
      'integration.request.querystring.bar': 'method.request.querystring.bar',
      'integration.request.path.foo': 'method.request.path.foo',
      'integration.request.path.bar': 'method.request.path.bar',
      'integration.request.header.foo': 'method.request.header.foo',
      'integration.request.header.bar': 'method.request.header.bar',
    });
  });

  it('should support HTTP integration type with custom request options', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'HTTP',
          request: {
            uri: 'https://example.com',
            method: 'put',
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Type
    ).to.equal('HTTP');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Uri
    ).to.equal('https://example.com');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.IntegrationHttpMethod
    ).to.equal('PUT');
  });

  it('should support HTTP_PROXY integration type', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'HTTP_PROXY',
          request: {
            uri: 'https://example.com',
            method: 'patch',
            parameters: {
              'method.request.querystring.foo': true,
              'method.request.querystring.bar': false,
              'method.request.path.foo': true,
              'method.request.path.bar': false,
              'method.request.header.foo': true,
              'method.request.header.bar': false,
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Type
    ).to.equal('HTTP_PROXY');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Uri
    ).to.equal('https://example.com');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.IntegrationHttpMethod
    ).to.equal('PATCH');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestParameters
    ).to.deep.equal({
      'integration.request.querystring.foo': 'method.request.querystring.foo',
      'integration.request.querystring.bar': 'method.request.querystring.bar',
      'integration.request.path.foo': 'method.request.path.foo',
      'integration.request.path.bar': 'method.request.path.bar',
      'integration.request.header.foo': 'method.request.header.foo',
      'integration.request.header.bar': 'method.request.header.bar',
    });
  });

  it('should support MOCK integration type', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'MOCK',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Type
    ).to.equal('MOCK');
  });

  it('should add request parameter when async config is used', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          async: true,
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestParameters[
        'integration.request.header.X-Amz-Invocation-Type'
      ]
    ).to.equal("'Event'");
  });

  it('should add request parameter when integration type is AWS_PROXY and async', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS_PROXY',
          async: true,
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestParameters[
        'integration.request.header.X-Amz-Invocation-Type'
      ]
    ).to.equal("'Event'");
  });

  it('should add request parameter mapped value when explicitly defined', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'HTTP_PROXY',
          request: {
            uri: 'https://example.com',
            parameters: {
              'method.request.querystring.foo': {
                required: true,
                mappedValue: 'fooValue',
              },
              'method.request.querystring.bar': {
                required: false,
                mappedValue: 'barValue',
              },
              'method.request.path.foo': {
                required: true,
                mappedValue: 'fooValue',
              },
              'method.request.path.bar': {
                required: false,
                mappedValue: 'barValue',
              },
              'method.request.header.foo': {
                required: true,
                mappedValue: 'fooValue',
              },
              'method.request.header.bar': {
                required: false,
                mappedValue: 'barValue',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.header.foo']
    ).to.equal(true);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.header.bar']
    ).to.equal(false);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters[
        'method.request.querystring.foo'
      ]
    ).to.equal(true);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters[
        'method.request.querystring.bar'
      ]
    ).to.equal(false);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.path.foo']
    ).to.equal(true);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.RequestParameters['method.request.path.bar']
    ).to.equal(false);
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestParameters
    ).to.deep.equal({
      'integration.request.querystring.foo': 'fooValue',
      'integration.request.querystring.bar': 'barValue',
      'integration.request.path.foo': 'fooValue',
      'integration.request.path.bar': 'barValue',
      'integration.request.header.foo': 'fooValue',
      'integration.request.header.bar': 'barValue',
    });
  });

  it('should set required to true when omitted from mapped value', async () => {
    const { cfTemplate } = await runServerless({
      command: 'package',
      fixture: 'function',
      configExt: {
        functions: {
          basic: {
            events: [
              {
                http: {
                  path: 'users/create',
                  method: 'post',
                  integration: 'HTTP_PROXY',
                  request: {
                    uri: 'https://example.com',
                    parameters: {
                      querystrings: {
                        foo: {
                          mappedValue: 'bar',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(
      cfTemplate.Resources.ApiGatewayMethodUsersCreatePost.Properties.RequestParameters[
        'method.request.querystring.foo'
      ]
    ).to.equal(true);
  });

  it('should set authorizer config for AWS_IAM', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          authorizer: {
            type: 'AWS_IAM',
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationType
    ).to.equal('AWS_IAM');
  });

  it('should set custom authorizer config with authorizerId', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          authorizer: {
            type: 'COGNITO_USER_POOLS',
            authorizerId: 'gy7lyj',
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationType
    ).to.equal('COGNITO_USER_POOLS');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizerId
    ).to.equal('gy7lyj');
  });

  it('should set authorizer config if given as ARN string', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'Authorizer',
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationType
    ).to.equal('CUSTOM');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizerId.Ref
    ).to.equal('AuthorizerApiGatewayAuthorizer');
  });

  it('should set authorizer config for a cognito user pool when given authorizer arn', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            arn: 'arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_ZZZ',
            scopes: ['myapp/read', 'myapp/write'],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationType
    ).to.equal('COGNITO_USER_POOLS');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationScopes
    ).to.contain('myapp/read');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizerId.Ref
    ).to.equal('AuthorizerApiGatewayAuthorizer');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates['application/json']
    ).to.not.match(/undefined/);
  });

  it('should set authorizer config for a cognito user pool when given authorizerId Ref', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            type: 'COGNITO_USER_POOLS',
            authorizerId: { Ref: 'CognitoAuthorizer' },
            scopes: ['myapp/read', 'myapp/write'],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationType
    ).to.equal('COGNITO_USER_POOLS');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationScopes
    ).to.contain('myapp/read');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizerId.Ref
    ).to.equal('CognitoAuthorizer');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates['application/json']
    ).to.not.match(/undefined/);
  });

  it('should set authorizer config for a cognito user pool when given cognito arn object', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            type: 'COGNITO_USER_POOLS',
            arn: {
              'Fn::GetAtt': ['CognitoUserPool', 'Arn'],
            },
            scopes: ['myapp/read', 'myapp/write'],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationType
    ).to.equal('COGNITO_USER_POOLS');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizationScopes
    ).to.contain('myapp/read');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.AuthorizerId.Ref
    ).to.equal('AuthorizerApiGatewayAuthorizer');

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates['application/json']
    ).to.not.match(/undefined/);
  });

  it('should not scopes for a cognito user pool when given empty scopes array', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            type: 'COGNITO_USER_POOLS',
            authorizerId: { Ref: 'CognitoAuthorizer' },
            scopes: [],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties
    ).to.not.have.property('AuthorizationScopes');
  });

  it('should set claims for a cognito user pool', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            arn: 'arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_ZZZ',
            claims: ['email'],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    const jsonRequestTemplatesString =
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates[
        'application/json'
      ];
    const cognitoPoolClaimsRegex = /"cognitoPoolClaims"\s*:\s*(\{[^}]*\})/;
    const cognitoPoolClaimsString = jsonRequestTemplatesString.match(cognitoPoolClaimsRegex)[1];
    const cognitoPoolClaims = JSON.parse(cognitoPoolClaimsString);
    expect(cognitoPoolClaims.email).to.equal('$context.authorizer.claims.email');
  });

  it('should set multiple claims for a cognito user pool', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            arn: 'arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_ZZZ',
            claims: ['email', 'gender'],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    const jsonRequestTemplatesString =
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates[
        'application/json'
      ];
    const cognitoPoolClaimsRegex = /"cognitoPoolClaims"\s*:\s*(\{[^}]*\})/;
    const cognitoPoolClaimsString = jsonRequestTemplatesString.match(cognitoPoolClaimsRegex)[1];
    const cognitoPoolClaims = JSON.parse(cognitoPoolClaimsString);
    expect(cognitoPoolClaims.email).to.equal('$context.authorizer.claims.email');
    expect(cognitoPoolClaims.gender).to.equal('$context.authorizer.claims.gender');
  });

  it('should properly set claims for custom properties inside the cognito user pool', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            arn: 'arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_ZZZ',
            claims: ['email', 'custom:score'],
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    const jsonRequestTemplatesString =
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates[
        'application/json'
      ];
    const cognitoPoolClaimsRegex = /"cognitoPoolClaims"\s*:\s*(\{[^}]*\})/;
    const cognitoPoolClaimsString = jsonRequestTemplatesString.match(cognitoPoolClaimsRegex)[1];
    const cognitoPoolClaims = JSON.parse(cognitoPoolClaimsString);
    expect(cognitoPoolClaims.email).to.equal('$context.authorizer.claims.email');
    expect(cognitoPoolClaims.score).to.equal("$context.authorizer.claims['custom:score']");
  });

  it('should replace the extra claims in the template if there are none', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          authorizer: {
            name: 'authorizer',
            arn: 'arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_ZZZ',
          },
          integration: 'AWS',
          path: 'users/create',
          method: 'post',
        },
      },
    ];

    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.RequestTemplates['application/json']
    ).to.not.match(/extraCognitoPoolClaims/);
  });

  it('should not create method resources when http events are not given', () => {
    awsCompileApigEvents.validated.events = [];

    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
    ).to.deep.equal({});
  });

  it('should update the method logical ids array', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
        },
      },
      {
        functionName: 'Second',
        http: {
          method: 'get',
          path: 'users/list',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(awsCompileApigEvents.apiGatewayMethodLogicalIds.length).to.equal(2);
    expect(awsCompileApigEvents.apiGatewayMethodLogicalIds).to.deep.equal([
      'ApiGatewayMethodUsersCreatePost',
      'ApiGatewayMethodUsersListGet',
    ]);
  });

  it('should set api key as required if private endpoint', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          private: true,
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.ApiKeyRequired
    ).to.equal(true);
  });

  it('should set api key as not required if private property is not specified', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.ApiKeyRequired
    ).to.equal(false);
  });

  it('should set the correct lambdaUri', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
        },
      },
      {
        functionName: 'Second',
        http: {
          method: 'get',
          path: 'users/list',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.Uri
    ).to.deep.equal({
      'Fn::Join': [
        '',
        [
          'arn:',
          { Ref: 'AWS::Partition' },
          ':apigateway:',
          { Ref: 'AWS::Region' },
          ':lambda:path/2015-03-31/functions/',
          { 'Fn::GetAtt': ['FirstLambdaFunction', 'Arn'] },
          '/invocations',
        ],
      ],
    });
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.Uri
    ).to.deep.equal({
      'Fn::Join': [
        '',
        [
          'arn:',
          { Ref: 'AWS::Partition' },
          ':apigateway:',
          { Ref: 'AWS::Region' },
          ':lambda:path/2015-03-31/functions/',
          { 'Fn::GetAtt': ['SecondLambdaFunction', 'Arn'] },
          '/invocations',
        ],
      ],
    });
  });

  it('Should point target alias if set', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'Provisioned',
        http: {
          method: 'get',
          path: 'users/list',
        },
      },
    ];
    serverless.service.functions.Provisioned = {
      targetAlias: { name: 'provisioned', logicalId: 'IrrelevantLogicalId' },
    };
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.Uri
    ).to.deep.equal({
      'Fn::Join': [
        '',
        [
          'arn:',
          { Ref: 'AWS::Partition' },
          ':apigateway:',
          { Ref: 'AWS::Region' },
          ':lambda:path/2015-03-31/functions/',
          { 'Fn::GetAtt': ['ProvisionedLambdaFunction', 'Arn'] },
          ':',
          'provisioned',
          '/invocations',
        ],
      ],
    });
  });

  it('should add CORS origins to method only when CORS is enabled', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
          cors: {
            origin: 'http://example.com',
          },
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
        },
      },
      {
        functionName: 'Second',
        http: {
          method: 'get',
          path: 'users/list',
          integration: 'AWS',
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
        },
      },
      {
        functionName: 'Third',
        http: {
          path: 'users/update',
          method: 'PUT',
          integration: 'AWS',
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
          cors: {
            origins: ['*'],
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Access-Control-Allow-Origin']
    ).to.equal("'http://example.com'");

    // CORS not enabled!
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Access-Control-Allow-Origin']
    ).to.not.equal("'*'");

    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersUpdatePut.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Access-Control-Allow-Origin']
    ).to.equal("'*'");
  });

  it('should set CORS allowCredentials to method only when specified', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
          cors: {
            origin: 'http://example.com',
            allowCredentials: true,
          },
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
        },
      },
      {
        functionName: 'Second',
        http: {
          method: 'get',
          path: 'users/list',
          integration: 'AWS',
          cors: {
            origin: 'http://example.com',
          },
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Access-Control-Allow-Credentials']
    ).to.equal('true');

    // allowCredentials not enabled
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Access-Control-Allow-Credentials']
    ).to.not.equal('true');
  });

  describe('when dealing with request configuration', () => {
    it('should setup a default "application/json" template', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'Second',
          http: {
            method: 'get',
            path: 'users/list',
            integration: 'AWS',
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.RequestTemplates['application/json']
      ).to.have.length.above(0);
    });

    it('should setup a default "application/x-www-form-urlencoded" template', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'Second',
          http: {
            method: 'get',
            path: 'users/list',
            integration: 'AWS',
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.RequestTemplates[
          'application/x-www-form-urlencoded'
        ]
      ).to.have.length.above(0);
    });

    it('should use defined pass-through behavior', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            request: {
              passThrough: 'WHEN_NO_TEMPLATES',
            },
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.PassthroughBehavior
      ).to.equal('WHEN_NO_TEMPLATES');
    });

    it('should use defined content-handling behavior (request)', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            request: {
              contentHandling: 'CONVERT_TO_TEXT',
            },
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.ContentHandling
      ).to.equal('CONVERT_TO_TEXT');
    });

    it('should use defined response content-handling behavior for 2XX only (response)', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            response: {
              contentHandling: 'CONVERT_TO_BINARY',
              statusCodes: {
                200: {
                  pattern: '',
                },
                400: {
                  pattern: '400',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
          .ContentHandling
      ).to.equal('CONVERT_TO_BINARY');
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
          .ContentHandling
      ).to.equal(undefined);
    });

    it('should set custom request templates', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            request: {
              template: {
                'template/1': '{ "stage" : "$context.stage" }',
                'template/2': '{ "httpMethod" : "$context.httpMethod" }',
              },
            },
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.RequestTemplates['template/1']
      ).to.equal('{ "stage" : "$context.stage" }');

      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.RequestTemplates['template/2']
      ).to.equal('{ "httpMethod" : "$context.httpMethod" }');
    });

    it('should be possible to overwrite default request templates', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            request: {
              template: {
                'application/json': 'overwritten-request-template-content',
              },
            },
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.RequestTemplates['application/json']
      ).to.equal('overwritten-request-template-content');
    });
  });

  describe('when dealing with response configuration', () => {
    it('should set the custom headers', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            response: {
              statusCodes: {
                200: {
                  pattern: '',
                  headers: {
                    'Content-Type': "'text/plain'",
                    'My-Custom-Header': 'my/custom/header',
                  },
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
          .ResponseParameters['method.response.header.Content-Type']
      ).to.equal("'text/plain'");
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
          .ResponseParameters['method.response.header.My-Custom-Header']
      ).to.equal('my/custom/header');
    });

    it('should set the custom template', () => {
      awsCompileApigEvents.validated.events = [
        {
          functionName: 'First',
          http: {
            method: 'GET',
            path: 'users/list',
            integration: 'AWS',
            response: {
              statusCodes: {
                200: {
                  template: "$input.path('$.foo')",
                  pattern: '',
                },
              },
            },
          },
        },
      ];
      awsCompileApigEvents.compileMethods();
      expect(
        awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
          .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
          .ResponseTemplates['application/json']
      ).to.equal("$input.path('$.foo')");
    });
  });

  it('should add method responses for different status codes', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          method: 'get',
          path: 'users/list',
          integration: 'AWS',
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
              202: {
                pattern: 'foo',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.MethodResponses[0].StatusCode
    ).to.equal('200');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.MethodResponses[1].StatusCode
    ).to.equal('202');
  });

  it('should add integration responses for different status codes', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          method: 'get',
          path: 'users/list',
          integration: 'AWS',
          response: {
            statusCodes: {
              200: {
                pattern: '',
              },
              202: {
                pattern: 'foo',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
    ).to.deep.equal({
      StatusCode: '202',
      SelectionPattern: 'foo',
      ResponseParameters: {},
      ResponseTemplates: {},
      ContentHandling: undefined,
    });
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
    ).to.deep.equal({
      StatusCode: '200',
      SelectionPattern: '',
      ResponseParameters: {},
      ResponseTemplates: {},
      ContentHandling: undefined,
    });
  });

  it('should add fall back headers and template to statusCodes', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          method: 'GET',
          path: 'users/list',
          integration: 'AWS',
          response: {
            headers: {
              'Content-Type': 'text/csv',
            },
            template: 'foo',
            statusCodes: {
              400: {
                pattern: '',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseTemplates['application/json']
    ).to.equal('foo');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Content-Type']
    ).to.equal('text/csv');
  });

  it('should add custom response codes', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          method: 'GET',
          path: 'users/list',
          integration: 'AWS',
          response: {
            statusCodes: {
              200: {
                pattern: '',
                template: "$input.path('$.foo')",
              },
              404: {
                pattern: '.*"statusCode":404,.*',
                template: "$input.path('$.errorMessage')",
                headers: {
                  'Content-Type': 'text/html',
                },
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseTemplates['application/json']
    ).to.equal("$input.path('$.foo')");
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .SelectionPattern
    ).to.equal('');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .ResponseTemplates['application/json']
    ).to.equal("$input.path('$.errorMessage')");
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .SelectionPattern
    ).to.equal('.*"statusCode":404,.*');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .ResponseParameters['method.response.header.Content-Type']
    ).to.equal('text/html');
  });

  it('should add multiple response templates for a custom response codes', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          method: 'GET',
          path: 'users/list',
          integration: 'AWS',
          response: {
            statusCodes: {
              200: {
                template: "$input.path('$.foo')",
                headers: {
                  'Content-Type': 'text/csv',
                },
              },
              404: {
                pattern: '.*"statusCode":404,.*',
                template: {
                  'application/json': "$input.path('$.errorMessage')",
                  'application/xml': "$input.path('$.xml.errorMessage')",
                },
                headers: {
                  'Content-Type': 'text/html',
                },
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseTemplates['application/json']
    ).to.equal("$input.path('$.foo')");
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .SelectionPattern
    ).to.equal('');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0]
        .ResponseParameters['method.response.header.Content-Type']
    ).to.equal('text/csv');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .ResponseTemplates['application/json']
    ).to.equal("$input.path('$.errorMessage')");
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .ResponseTemplates['application/xml']
    ).to.equal("$input.path('$.xml.errorMessage')");
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .SelectionPattern
    ).to.equal('.*"statusCode":404,.*');
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[1]
        .ResponseParameters['method.response.header.Content-Type']
    ).to.equal('text/html');
  });

  it('should use defined content-handling behavior', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          method: 'get',
          path: 'users/list',
          integration: 'AWS',
          response: {
            contentHandling: 'CONVERT_TO_BINARY',
            statusCodes: {
              200: {
                pattern: '',
              },
            },
          },
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersListGet.Properties.Integration.IntegrationResponses[0].ContentHandling
    ).to.equal('CONVERT_TO_BINARY');
  });

  it('should handle root resource methods', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: '',
          method: 'GET',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodGet.Properties.ResourceId
    ).to.deep.equal({
      'Fn::GetAtt': ['ApiGatewayRestApi', 'RootResourceId'],
    });
  });

  it('should include operation id as OperationName when it is set', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
          operationId: 'createUser',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties.OperationName
    ).to.equal('createUser');
  });

  it('should not include operation id when it is not set', () => {
    awsCompileApigEvents.validated.events = [
      {
        functionName: 'First',
        http: {
          path: 'users/create',
          method: 'post',
          integration: 'AWS',
        },
      },
    ];
    awsCompileApigEvents.compileMethods();
    expect(
      awsCompileApigEvents.serverless.service.provider.compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreatePost.Properties
    ).to.not.have.key('OperationName');
  });
});

describe('#compileMethods v2()', () => {
  describe('request configuration', () => {
    it('should delete the default "application/x-www-form-urlencoded" template if it\'s overriden with null', async () => {
      const {
        awsNaming,
        cfTemplate: { Resources: cfResources },
      } = await runServerless({
        fixture: 'api-gateway',
        configExt: {
          functions: {
            foo: {
              events: [
                {
                  http: {
                    integration: 'AWS',
                    request: { template: { 'application/x-www-form-urlencoded': null } },
                  },
                },
              ],
            },
          },
        },
        command: 'package',
      });
      const apiGatewayMethodConfig = cfResources[awsNaming.getMethodLogicalId('Foo', 'GET')];

      expect(apiGatewayMethodConfig.Properties.Integration.RequestTemplates).to.not.have.property(
        'application/x-www-form-urlencoded'
      );
    });
  });

  describe('method authorization', () => {
    it('should correctly set method authorization properties', async () => {
      const {
        awsNaming,
        cfTemplate: { Resources: cfResources },
      } = await runServerless({
        fixture: 'api-gateway',
        configExt: {
          functions: {
            foo: {
              events: [
                {
                  http: {
                    authorizer: {
                      type: 'REQUEST',
                      authorizerId: 'some-id',
                    },
                  },
                },
                {
                  http: {
                    authorizer: {
                      type: 'TOKEN',
                      authorizerId: 'another-id',
                    },
                  },
                },
              ],
            },
          },
        },
        command: 'package',
      });
      const apiGatewayRequestMethodConfig = cfResources[awsNaming.getMethodLogicalId('Foo', 'GET')];
      expect(apiGatewayRequestMethodConfig.Properties.AuthorizationType).to.equal('CUSTOM');
      expect(apiGatewayRequestMethodConfig.Properties.AuthorizerId).to.deep.equal('some-id');

      const apiGatewayTokenMethodConfig =
        cfResources[awsNaming.getMethodLogicalId('SomeDashpost', 'POST')];
      expect(apiGatewayTokenMethodConfig.Properties.AuthorizationType).to.equal('CUSTOM');
      expect(apiGatewayTokenMethodConfig.Properties.AuthorizerId).to.deep.equal('another-id');
    });
  });

  it('should depends on permission resource', async () => {
    const {
      awsNaming,
      cfTemplate: { Resources: cfResources },
    } = await runServerless({
      command: 'package',
      fixture: 'api-gateway',
    });
    const FooApiGatewayMethodConfig = cfResources[awsNaming.getMethodLogicalId('Foo', 'GET')];
    const OtherApiGatewayMethodConfig =
      cfResources[awsNaming.getMethodLogicalId('BarMarkoVar', 'GET')];

    const permNameFoo = awsNaming.getLambdaApiGatewayPermissionLogicalId('Foo');
    const permNameOther = awsNaming.getLambdaApiGatewayPermissionLogicalId('Other');

    expect(FooApiGatewayMethodConfig.DependsOn).to.include(permNameFoo);
    expect(OtherApiGatewayMethodConfig.DependsOn).to.include(permNameOther);
  });
});
