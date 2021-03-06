'use strict';

const { createReportError } = require('./utils/createReportError');

exports.checkResolutionsHasExplanation = (
  pkg,
  pkgPathName,
  checkMessage,
  getDependencyPackageJson,
) => {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  const reportError = createReportError(
    'Resolutions has explanation',
    pkgPathName,
  );

  Object.keys(pkgResolutions).forEach((depKey) => {
    if (!pkgResolutionsExplained[depKey]) {
      reportError(`Missing "${depKey}" in resolutionsExplained.`);
    }
  });

  Object.keys(pkgResolutionsExplained).forEach((depKey) => {
    if (!pkgResolutions[depKey]) {
      reportError(
        `Found "${depKey}" in resolutionsExplained but not in resolutions.`,
      );
    } else {
      const error = checkMessage(depKey, pkgResolutionsExplained[depKey], {
        getDependencyPackageJson,
      });
      if (error) {
        reportError(
          `Invalid message for "${depKey}" in resolutionsExplained`,
          `${error}.`,
        );
      }
    }
  });
};
