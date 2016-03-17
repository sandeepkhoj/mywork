'use strict';

/*
 *  Copyright (c) 2015, TopCoder, Inc. All rights reserved.
 */
/**
 * This file defines the filters for this application.
 * @author duxiaoyang
 * @version 1.0
 */
var appFilter = angular.module('tholos.filter', []);

// The filter used to convert object to array.
appControllers.filter('toArray', function () {
  return function (obj, addKey) {
    if (!obj) return obj;
    if ( addKey === false ) {
      return Object.keys(obj).map(function(key) {
        return obj[key];
      });
    } else {
      return Object.keys(obj).map(function (key) {
        return Object.defineProperty(obj[key], '$key', { enumerable: false, value: key});
      });
    }
  };
});