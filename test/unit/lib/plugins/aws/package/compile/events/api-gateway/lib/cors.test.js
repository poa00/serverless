'use strict'

const expect = require('chai').expect
const AwsCompileApigEvents = require('../../../../../../../../../../lib/plugins/aws/package/compile/events/api-gateway/index')
const Serverless = require('../../../../../../../../../../lib/serverless')
const AwsProvider = require('../../../../../../../../../../lib/plugins/aws/provider')

describe('#compileCors()', () => {
  let serverless
  let awsCompileApigEvents

  beforeEach(() => {
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    }
    serverless = new Serverless({ commands: [], options: {} })
    serverless.setProvider('aws', new AwsProvider(serverless, options))
    serverless.service.service = 'first-service'
    serverless.service.provider.compiledCloudFormationTemplate = {
      Resources: {},
    }
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
    }
    awsCompileApigEvents = new AwsCompileApigEvents(serverless, options)
    awsCompileApigEvents.apiGatewayMethodLogicalIds = []
    awsCompileApigEvents.apiGatewayRestApiLogicalId = 'ApiGatewayRestApi'
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
      'users/any': {
        name: 'UsersAny',
        resourceLogicalId: 'ApiGatewayResourceUsersAny',
      },
    }
    awsCompileApigEvents.validated = {}
  })

  it('should create preflight method for CORS enabled resource', () => {
    awsCompileApigEvents.validated.corsPreflight = {
      'users/update': {
        origin: 'http://example.com',
        origins: [],
        headers: ['*'],
        methods: ['OPTIONS', 'PUT'],
        allowCredentials: false,
        maxAge: 86400,
        cacheControl: 'max-age=600, s-maxage=600',
      },
      'users/create': {
        origins: ['http://localhost:3000', 'https://*.example.com'],
        headers: ['*'],
        methods: ['OPTIONS', 'POST'],
        allowCredentials: true,
        maxAge: 86400,
        cacheControl: 'max-age=600, s-maxage=600',
      },
      'users/delete': {
        origins: ['*'],
        headers: ['CustomHeaderA', 'CustomHeaderB'],
        methods: ['OPTIONS', 'DELETE'],
        allowCredentials: false,
        maxAge: 86400,
        cacheControl: 'max-age=600, s-maxage=600',
      },
      'users/any': {
        origin: 'http://localhost:3000,http://example.com',
        headers: ['*'],
        methods: ['OPTIONS', 'ANY'],
        allowCredentials: false,
      },
    }
    awsCompileApigEvents.compileCors()
    // users/create
    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Origin'
      ],
    ).to.equal("'http://localhost:3000'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseTemplates['application/json'],
    ).to.equal(
      '#set($origin = $input.params("Origin"))\n#if($origin == "") #set($origin = $input.params("origin")) #end\n#if($origin.matches("http://localhost:3000") || $origin.matches("https://.+[.]example[.]com")) #set($context.responseOverride.header.Access-Control-Allow-Origin = $origin) #end',
    )

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Headers'
      ],
    ).to.equal("'*'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Methods'
      ],
    ).to.equal("'OPTIONS,POST'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Credentials'
      ],
    ).to.equal("'true'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Max-Age'
      ],
    ).to.equal("'86400'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersCreateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Cache-Control'
      ],
    ).to.equal("'max-age=600, s-maxage=600'")

    // users/update
    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersUpdateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Origin'
      ],
    ).to.equal("'http://example.com'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersUpdateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Methods'
      ],
    ).to.equal("'OPTIONS,PUT'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersUpdateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Credentials'
      ],
    ).to.be.undefined

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersUpdateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Max-Age'
      ],
    ).to.equal("'86400'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersUpdateOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Cache-Control'
      ],
    ).to.equal("'max-age=600, s-maxage=600'")

    // users/delete
    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersDeleteOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Origin'
      ],
    ).to.equal("'*'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersDeleteOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Headers'
      ],
    ).to.equal("'CustomHeaderA,CustomHeaderB'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersDeleteOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Methods'
      ],
    ).to.equal("'OPTIONS,DELETE'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersDeleteOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Credentials'
      ],
    ).to.be.undefined

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersDeleteOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Max-Age'
      ],
    ).to.equal("'86400'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersDeleteOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Cache-Control'
      ],
    ).to.equal("'max-age=600, s-maxage=600'")

    // users/any
    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersAnyOptions.Properties.Integration
        .IntegrationResponses[0].ResponseTemplates['application/json'],
    ).to.equal(
      '#set($origin = $input.params("Origin"))\n#if($origin == "") #set($origin = $input.params("origin")) #end\n#if($origin.matches("http://localhost:3000") || $origin.matches("http://example[.]com")) #set($context.responseOverride.header.Access-Control-Allow-Origin = $origin) #end',
    )

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersAnyOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Headers'
      ],
    ).to.equal("'*'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersAnyOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Methods'
      ],
    ).to.equal("'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT'")

    expect(
      awsCompileApigEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources
        .ApiGatewayMethodUsersAnyOptions.Properties.Integration
        .IntegrationResponses[0].ResponseParameters[
        'method.response.header.Access-Control-Allow-Credentials'
      ],
    ).to.be.undefined
  })

  it('should add the methods resource logical id to the array of method logical ids', () => {
    awsCompileApigEvents.validated.corsPreflight = {
      'users/create': {
        origins: ['*', 'http://example.com'],
        headers: ['*'],
        methods: ['OPTIONS', 'POST'],
        allowCredentials: true,
        maxAge: 86400,
      },
      'users/any': {
        origins: ['http://example.com'],
        headers: ['*'],
        methods: ['OPTIONS', 'ANY'],
        allowCredentials: false,
      },
    }
    awsCompileApigEvents.compileCors()
    expect(awsCompileApigEvents.apiGatewayMethodLogicalIds).to.deep.equal([
      'ApiGatewayMethodUsersCreateOptions',
      'ApiGatewayMethodUsersAnyOptions',
    ])
  })
})
