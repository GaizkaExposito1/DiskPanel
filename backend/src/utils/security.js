const path = require('path');

function isPathInside(parent, child) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? true : (rel === '' ? true : false);
}

function resolveInside(root, ...parts) {
  const p = path.resolve(root, ...parts);
  if (!isPathInside(root, p)) {
    throw new Error('Path traversal detected');
  }
  return p;
}

module.exports = { isPathInside, resolveInside };
