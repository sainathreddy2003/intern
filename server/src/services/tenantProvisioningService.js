const { getTenantConnection } = require('../config/db');

const cloneTemplateSchema = async (templateDbName, targetDbName) => {
  const templateConn = await getTenantConnection(templateDbName);
  const targetConn = await getTenantConnection(targetDbName);

  const templateCollections = await templateConn.db.listCollections().toArray();

  for (const { name: collectionName } of templateCollections) {
    const exists = await targetConn.db.listCollections({ name: collectionName }).toArray();
    if (!exists.length) {
      await targetConn.db.createCollection(collectionName);
    }

    const targetCollection = targetConn.db.collection(collectionName);
    const templateIndexes = await templateConn.db.collection(collectionName).indexes();

    // Ensure target is empty before rebuilding indexes to avoid duplicate-key index build failures.
    await targetCollection.deleteMany({});

    const existingIndexes = await targetCollection.indexes();
    for (const existingIndex of existingIndexes) {
      if (existingIndex.name !== '_id_') {
        await targetCollection.dropIndex(existingIndex.name);
      }
    }

    for (const index of templateIndexes) {
      if (index.name === '_id_') {
        continue;
      }

      const { key, name, ...options } = index;
      await targetCollection.createIndex(key, { ...options, name });
    }

  }

  return {
    templateDbName,
    targetDbName,
    collectionsCloned: templateCollections.length,
  };
};

const cloneDatabaseWithData = async (sourceDbName, targetDbName) => {
  const sourceConn = await getTenantConnection(sourceDbName);
  const targetConn = await getTenantConnection(targetDbName);

  const sourceCollections = await sourceConn.db.listCollections().toArray();

  for (const { name: collectionName } of sourceCollections) {
    const existing = await targetConn.db.listCollections({ name: collectionName }).toArray();
    if (!existing.length) {
      await targetConn.db.createCollection(collectionName);
    }

    const sourceCollection = sourceConn.db.collection(collectionName);
    const targetCollection = targetConn.db.collection(collectionName);

    // Cleanup first so unique index builds are evaluated on clean target state.
    await targetCollection.deleteMany({});

    const existingIndexes = await targetCollection.indexes();
    for (const existingIndex of existingIndexes) {
      if (existingIndex.name !== '_id_') {
        await targetCollection.dropIndex(existingIndex.name);
      }
    }

    const sourceIndexes = await sourceCollection.indexes();
    for (const index of sourceIndexes) {
      if (index.name === '_id_') {
        continue;
      }
      const { key, name, ...options } = index;
      await targetCollection.createIndex(key, { ...options, name });
    }

    const docs = await sourceCollection.find({}).toArray();
    if (docs.length > 0) {
      await targetCollection.insertMany(docs, { ordered: false });
    }
  }

  return {
    sourceDbName,
    targetDbName,
    collectionsCopied: sourceCollections.length,
  };
};

module.exports = {
  cloneTemplateSchema,
  cloneDatabaseWithData,
};
