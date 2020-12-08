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

class DsAccountStatusChange extends StepBase {
  async start() {
    this.print('start pinging studies for newly reachable data source account');

    // Get services
    const [studyService, dataSourceRegistrationService] = await this.service([
      'studyService',
      'dataSourceRegistrationService',
    ]);

    // Get common payload params and pull environment info
    const requestContext = await this.payload.object('requestContext');
    const accountId = await this.payload.object('id');

    // For dsAccount, find all (not just unreachable) studies
    const studies = await studyService.listStudiesForAccount(requestContext, accountId);

    // For each study, reach out
    await Promise.all(
      _.map(studies, async study => {
        await dataSourceRegistrationService.attemptReach(requestContext, { id: study.id, type: 'study' });
      }),
    );
  }
}

module.exports = DsAccountStatusChange;
