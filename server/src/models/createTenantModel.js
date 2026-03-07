const { getTenantDbName } = require('../context/tenantContext');
const { getTenantModel } = require('../config/db');

const createTenantModel = (modelName, schema) => {
  const resolveModel = () => getTenantModel(getTenantDbName(), modelName, schema);

  return new Proxy(
    function tenantModelProxy() {},
    {
      get(_target, prop) {
        const model = resolveModel();
        const value = model[prop];
        return typeof value === 'function' ? value.bind(model) : value;
      },
      construct(_target, args) {
        const Model = resolveModel();
        return new Model(...args);
      },
      apply(_target, thisArg, args) {
        const Model = resolveModel();
        return Model.apply(thisArg, args);
      },
    }
  );
};

module.exports = createTenantModel;
