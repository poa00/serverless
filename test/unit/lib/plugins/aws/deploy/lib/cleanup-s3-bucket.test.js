'use strict'

/* eslint-disable no-unused-expressions */

const sinon = require('sinon')
const chai = require('chai')
const AwsProvider = require('../../../../../../../lib/plugins/aws/provider')
const AwsDeploy = require('../../../../../../../lib/plugins/aws/deploy/index')
const Serverless = require('../../../../../../../lib/serverless')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

const expect = chai.expect

describe('cleanupS3Bucket', () => {
  let serverless
  let provider
  let awsDeploy
  let s3Key

  beforeEach(() => {
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    }
    serverless = new Serverless({ commands: [], options: {} })
    serverless.serviceDir = 'foo'
    provider = new AwsProvider(serverless, options)
    serverless.setProvider('aws', provider)
    serverless.service.service = 'cleanupS3Bucket'
    const prefix = provider.getDeploymentPrefix()
    s3Key = `${prefix}/${serverless.service.service}/${provider.getStage()}`
    awsDeploy = new AwsDeploy(serverless, options)
    awsDeploy.bucketName = 'deployment-bucket'
    awsDeploy.serverless.cli = new serverless.classes.CLI()
  })

  describe('#getObjectsToRemove()', () => {
    it('should resolve if no objects are found', async () => {
      const serviceObjects = {
        Contents: [],
      }

      const listObjectsStub = sinon
        .stub(awsDeploy.provider, 'request')
        .resolves(serviceObjects)

      return awsDeploy.getObjectsToRemove().then(() => {
        expect(listObjectsStub).to.have.been.calledOnce
        expect(listObjectsStub).to.have.been.calledWithExactly(
          'S3',
          'listObjectsV2',
          {
            Bucket: awsDeploy.bucketName,
            Prefix: `${s3Key}`,
          },
        )
        awsDeploy.provider.request.restore()
      })
    })

    it('should return all to be removed service objects (except the last 4)', async () => {
      const serviceObjects = {
        Contents: [
          { Key: `${s3Key}/151224711231-2016-08-18T15:42:00/artifact.zip` },
          {
            Key: `${s3Key}/151224711231-2016-08-18T15:42:00/cloudformation.json`,
          },
          { Key: `${s3Key}/141264711231-2016-08-18T15:43:00/artifact.zip` },
          {
            Key: `${s3Key}/141264711231-2016-08-18T15:43:00/cloudformation.json`,
          },
          { Key: `${s3Key}/141321321541-2016-08-18T11:23:02/artifact.zip` },
          {
            Key: `${s3Key}/141321321541-2016-08-18T11:23:02/cloudformation.json`,
          },
          { Key: `${s3Key}/142003031341-2016-08-18T12:46:04/artifact.zip` },
          {
            Key: `${s3Key}/142003031341-2016-08-18T12:46:04/cloudformation.json`,
          },
          { Key: `${s3Key}/113304333331-2016-08-18T13:40:06/artifact.zip` },
          {
            Key: `${s3Key}/113304333331-2016-08-18T13:40:06/cloudformation.json`,
          },
          { Key: `${s3Key}/903940390431-2016-08-18T23:42:08/artifact.zip` },
          {
            Key: `${s3Key}/903940390431-2016-08-18T23:42:08/cloudformation.json`,
          },
        ],
      }

      const listObjectsStub = sinon
        .stub(awsDeploy.provider, 'request')
        .resolves(serviceObjects)

      return awsDeploy.getObjectsToRemove().then((objectsToRemove) => {
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/141321321541-2016-08-18T11:23:02/artifact.zip`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/141321321541-2016-08-18T11:23:02/cloudformation.json`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/142003031341-2016-08-18T12:46:04/artifact.zip`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/142003031341-2016-08-18T12:46:04/cloudformation.json`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/151224711231-2016-08-18T15:42:00/artifact.zip`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/151224711231-2016-08-18T15:42:00/cloudformation.json`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/903940390431-2016-08-18T23:42:08/artifact.zip`,
        })
        expect(objectsToRemove).to.not.include({
          Key: `${s3Key}${s3Key}/903940390431-2016-08-18T23:42:08/cloudformation.json`,
        })
        expect(listObjectsStub.calledOnce).to.be.equal(true)
        expect(listObjectsStub).to.have.been.calledWithExactly(
          'S3',
          'listObjectsV2',
          {
            Bucket: awsDeploy.bucketName,
            Prefix: `${s3Key}`,
          },
        )
        awsDeploy.provider.request.restore()
      })
    })

    it('should return an empty array if there are less than 4 directories available', async () => {
      const serviceObjects = {
        Contents: [
          { Key: `${s3Key}151224711231-2016-08-18T15:42:00/artifact.zip` },
          {
            Key: `${s3Key}151224711231-2016-08-18T15:42:00/cloudformation.json`,
          },
          { Key: `${s3Key}141264711231-2016-08-18T15:42:00/artifact.zip` },
          {
            Key: `${s3Key}141264711231-2016-08-18T15:42:00/cloudformation.json`,
          },
          { Key: `${s3Key}141321321541-2016-08-18T11:23:02/artifact.zip` },
          {
            Key: `${s3Key}141321321541-2016-08-18T11:23:02/cloudformation.json`,
          },
        ],
      }

      const listObjectsStub = sinon
        .stub(awsDeploy.provider, 'request')
        .resolves(serviceObjects)

      return awsDeploy.getObjectsToRemove().then((objectsToRemove) => {
        expect(objectsToRemove.length).to.equal(0)
        expect(listObjectsStub.calledOnce).to.be.equal(true)
        expect(listObjectsStub).to.have.been.calledWithExactly(
          'S3',
          'listObjectsV2',
          {
            Bucket: awsDeploy.bucketName,
            Prefix: `${s3Key}`,
          },
        )
        awsDeploy.provider.request.restore()
      })
    })

    it('should return an empty array if there are exactly 4 directories available', async () => {
      const serviceObjects = {
        Contents: [
          { Key: `${s3Key}151224711231-2016-08-18T15:42:00/artifact.zip` },
          {
            Key: `${s3Key}151224711231-2016-08-18T15:42:00/cloudformation.json`,
          },
          { Key: `${s3Key}141264711231-2016-08-18T15:42:00/artifact.zip` },
          {
            Key: `${s3Key}141264711231-2016-08-18T15:42:00/cloudformation.json`,
          },
          { Key: `${s3Key}141321321541-2016-08-18T11:23:02/artifact.zip` },
          {
            Key: `${s3Key}141321321541-2016-08-18T11:23:02/cloudformation.json`,
          },
          { Key: `${s3Key}142003031341-2016-08-18T12:46:04/artifact.zip` },
          {
            Key: `${s3Key}142003031341-2016-08-18T12:46:04/cloudformation.json`,
          },
        ],
      }

      const listObjectsStub = sinon
        .stub(awsDeploy.provider, 'request')
        .resolves(serviceObjects)

      return awsDeploy.getObjectsToRemove().then((objectsToRemove) => {
        expect(objectsToRemove).to.have.lengthOf(0)
        expect(listObjectsStub).to.have.been.calledOnce
        expect(listObjectsStub).to.have.been.calledWithExactly(
          'S3',
          'listObjectsV2',
          {
            Bucket: awsDeploy.bucketName,
            Prefix: `${s3Key}`,
          },
        )
        awsDeploy.provider.request.restore()
      })
    })

    describe('custom maxPreviousDeploymentArtifacts', () => {
      afterEach(() => {
        // restore to not conflict with other tests
        delete serverless.service.provider.deploymentBucketObject
      })

      it('should allow configuring the number of artifacts to preserve', async () => {
        // configure the provider to allow only a single artifact
        serverless.service.provider.deploymentBucketObject = {
          maxPreviousDeploymentArtifacts: 1,
        }

        const serviceObjects = {
          Contents: [
            { Key: `${s3Key}/141321321541-2016-08-18T11:23:02/artifact.zip` },
            {
              Key: `${s3Key}/141321321541-2016-08-18T11:23:02/cloudformation.json`,
            },
            { Key: `${s3Key}/151224711231-2016-08-18T15:42:00/artifact.zip` },
            {
              Key: `${s3Key}/151224711231-2016-08-18T15:42:00/cloudformation.json`,
            },
            { Key: `${s3Key}/141264711231-2016-08-18T15:43:00/artifact.zip` },
            {
              Key: `${s3Key}/141264711231-2016-08-18T15:43:00/cloudformation.json`,
            },
          ],
        }

        const listObjectsStub = sinon
          .stub(awsDeploy.provider, 'request')
          .resolves(serviceObjects)

        return awsDeploy.getObjectsToRemove().then((objectsToRemove) => {
          expect(objectsToRemove).to.deep.include.members([
            { Key: `${s3Key}/141321321541-2016-08-18T11:23:02/artifact.zip` },
            {
              Key: `${s3Key}/141321321541-2016-08-18T11:23:02/cloudformation.json`,
            },
            { Key: `${s3Key}/151224711231-2016-08-18T15:42:00/artifact.zip` },
            {
              Key: `${s3Key}/151224711231-2016-08-18T15:42:00/cloudformation.json`,
            },
          ])

          expect(objectsToRemove).to.not.deep.include({
            Key: `${s3Key}/141264711231-2016-08-18T15:43:00/artifact.zip`,
          })

          expect(objectsToRemove).to.not.deep.include({
            Key: `${s3Key}/141264711231-2016-08-18T15:43:00/cloudformation.json`,
          })

          expect(listObjectsStub.calledOnce).to.be.equal(true)
          expect(listObjectsStub).to.have.been.calledWithExactly(
            'S3',
            'listObjectsV2',
            {
              Bucket: awsDeploy.bucketName,
              Prefix: `${s3Key}`,
            },
          )
          awsDeploy.provider.request.restore()
        })
      })
    })
  })

  describe('#removeObjects()', () => {
    let deleteObjectsStub

    beforeEach(() => {
      deleteObjectsStub = sinon.stub(awsDeploy.provider, 'request').resolves()
    })

    it('should resolve if no service objects are found in the S3 bucket', async () =>
      awsDeploy.removeObjects().then(() => {
        expect(deleteObjectsStub.calledOnce).to.be.equal(false)
        awsDeploy.provider.request.restore()
      }))

    it('should remove all old service files from the S3 bucket if available', async () => {
      const objectsToRemove = [
        { Key: `${s3Key}113304333331-2016-08-18T13:40:06/artifact.zip` },
        { Key: `${s3Key}113304333331-2016-08-18T13:40:06/cloudformation.json` },
        { Key: `${s3Key}141264711231-2016-08-18T15:42:00/artifact.zip` },
        { Key: `${s3Key}141264711231-2016-08-18T15:42:00/cloudformation.json` },
      ]

      return awsDeploy.removeObjects(objectsToRemove).then(() => {
        expect(deleteObjectsStub).to.have.been.calledOnce
        expect(deleteObjectsStub).to.have.been.calledWithExactly(
          'S3',
          'deleteObjects',
          {
            Bucket: awsDeploy.bucketName,
            Delete: {
              Objects: objectsToRemove,
            },
          },
        )
        awsDeploy.provider.request.restore()
      })
    })
  })

  describe('#cleanupS3Bucket()', () => {
    it('should run promise chain in order', async () => {
      const getObjectsToRemoveStub = sinon
        .stub(awsDeploy, 'getObjectsToRemove')
        .resolves()
      const removeObjectsStub = sinon
        .stub(awsDeploy, 'removeObjects')
        .resolves()

      return awsDeploy.cleanupS3Bucket().then(() => {
        expect(getObjectsToRemoveStub.calledOnce).to.be.equal(true)
        expect(
          removeObjectsStub.calledAfter(getObjectsToRemoveStub),
        ).to.be.equal(true)

        awsDeploy.getObjectsToRemove.restore()
        awsDeploy.removeObjects.restore()
      })
    })
  })
})
