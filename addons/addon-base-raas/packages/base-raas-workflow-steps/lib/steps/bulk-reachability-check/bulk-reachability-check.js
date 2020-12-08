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
const StepBase = require('@aws-ee/base-workflow-core/lib/workflow/helpers/step-base');

class BulkReachabilityCheck extends StepBase {
  async start() {
    this.print('start pinging data source accounts and/or studies contained with status pending');

    // Get services
    const [dataSourceAccountService, dataSourceRegistrationService] = await this.mustFindServices([
      'dataSourceAccountService',
      'dataSourceRegistrationService',
    ]);

    // Get common payload params and pull environment info
    const requestContext = await this.payload.object('requestContext');
    // If you specify an id, you can’t specify a status filter
    const status = await this.payload.object('status'); // This could also be '*'

    // Search for all dsAccounts with this status
    const dsAccountEntries = await dataSourceAccountService.list(requestContext);
    let dsAccountIds = [];
    if (status === '*') {
      dsAccountIds = _.map(dsAccountEntries, accountEntry => accountEntry.id);
    } else {
      const filteredDsAccounts = _.filter(dsAccountEntries, accountEntry => accountEntry.status === status);
      dsAccountIds = _.map(filteredDsAccounts, accountEntry => accountEntry.id);
    }

    await Promise.all(
      _.map(dsAccountIds, async dsAccountId => {
        await dataSourceRegistrationService.attemptReach(requestContext, { dsAccountId, type: 'dsAccount' });
      }),
    );
  }
}

module.exports = BulkReachabilityCheck;
