/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

const _ = require('lodash');
const Service = require('@aws-ee/base-services-container/lib/service');
const { runAndCatch } = require('@aws-ee/base-services/lib/helpers/utils');

const settingKeys = {
  tableName: 'StorageGateway',
};

class StorageGateway extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'lockService', 'aws', 'workflowTriggerService', 'dbService']);
  }

  async init() {
    // Get services
    this.jsonSchemaValidationService = await this.service('jsonSchemaValidationService');
    this.lockService = await this.service('lockService');
    this.aws = await this.service('aws');
    this.storageGateway = new this.aws.sdk.StorageGateway();
    this.ec2 = new this.aws.sdk.EC2();
    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);
    this._updater = () => dbService.helper.updater().table(table);
  }

  async saveToDDB(requestContext, rawData, id) {
    const by = _.get(requestContext, 'principalIdentifier.uid');
    // Prepare the db object
    const date = new Date().toISOString();
    const dbObject = this._fromRawToDbObject(rawData, {
      rev: 0,
      createdBy: by,
      updatedBy: by,
      createdAt: date,
      updatedAt: date,
    });
    // Time to save the the db object
    let dbResult;
    try {
      dbResult = await runAndCatch(
        async () => {
          return this._updater()
            .condition('attribute_not_exists(id)') // ensure that id doesn't already exist
            .key({ id })
            .item(dbObject)
            .update();
        },
        async () => {
          throw new Error(`Storage Gateway with id "${id}" already exists`);
        },
      );
    } catch (error) {
      this.log.log(error);
    }
    return dbResult;
  }

  // Do some properties renaming to prepare the object to be saved in the database
  _fromRawToDbObject(rawObject, overridingProps = {}) {
    const dbObject = { ...rawObject, ...overridingProps };
    return dbObject;
  }
}

module.exports = StorageGateway;
