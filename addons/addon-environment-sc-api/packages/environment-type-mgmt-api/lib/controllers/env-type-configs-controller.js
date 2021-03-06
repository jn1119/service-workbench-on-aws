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

async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const boom = context.boom;

  // ===============================================================
  //  GET / (mounted to /api/workspace-types/:id/configurations)
  // ===============================================================
  router.get(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const [envTypeConfigService] = await context.service(['envTypeConfigService']);

      const envTypeId = req.params.id;
      const includeAll = _.toLower(req.query.include) === 'all';
      const configs = await envTypeConfigService.list(requestContext, envTypeId, includeAll);
      res.status(200).json(configs);
    }),
  );

  // ===============================================================
  //  POST / (mounted to /api/workspace-types/:id/configurations)
  // ===============================================================
  router.post(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const [envTypeConfigService] = await context.service(['envTypeConfigService']);

      const envTypeId = req.params.id;
      const config = await envTypeConfigService.create(requestContext, envTypeId, req.body);
      res.status(200).json(config);
    }),
  );

  // ===============================================================
  //  GET / (mounted to /api/workspace-types/:id/configurations)
  // ===============================================================
  router.get(
    '/:configId',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const [envTypeConfigService] = await context.service(['envTypeConfigService']);

      const envTypeId = req.params.id;
      const configId = req.params.configId;
      const config = await envTypeConfigService.mustFind(requestContext, envTypeId, { id: configId });
      res.status(200).json(config);
    }),
  );

  // ===============================================================
  //  PUT / (mounted to /api/workspace-types/:id/configurations)
  // ===============================================================
  router.put(
    '/:configId',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const [envTypeConfigService] = await context.service(['envTypeConfigService']);

      const envTypeId = req.params.id;
      const configId = req.params.configId;
      if (req.body.id && configId !== req.body.id) {
        throw boom.badRequest(`The id in the request body does not match with the one in the path`, true);
      }
      const config = req.body;
      config.id = configId;
      const result = await envTypeConfigService.update(requestContext, envTypeId, config);
      res.status(200).json(result);
    }),
  );

  // ===============================================================
  //  DELETE / (mounted to /api/workspace-types/:id/configurations)
  // ===============================================================
  router.delete(
    '/:configId',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const [envTypeConfigService] = await context.service(['envTypeConfigService']);

      const envTypeId = req.params.id;
      const configId = req.params.configId;
      const result = await envTypeConfigService.delete(requestContext, envTypeId, configId);
      res.status(200).json(result);
    }),
  );

  return router;
}
module.exports = configure;
