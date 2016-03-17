'use strict';

/*
 *  Copyright (c) 2015, TopCoder, Inc. All rights reserved.
 */
/**
 * This file defines the common services for this application.
 * @author duxiaoyang
 * @version 1.0
 */
var appServices = angular.module('tholos.services', []);

// common services
appServices.factory('common', ['$http', '$q', function($http, $q) {
	return {
		/**
		 * Set credentials to default HTTP header.
		 * @param {String} the user name.
		 * @param {String} the password.
		 * @returns {String} the authentication header.
		 */
		setCredentials: function(username, password) {
			var authHeader = btoa(username + ':' + password);
			$http.defaults.headers.common.Authorization = 'Basic ' + authHeader;
			return authHeader;
		},
		/**
		 * Set the authentication header.
		 * @param {String} the authentication header.
		 */
		setAuthHeader: function(authHeader) {
			$http.defaults.headers.common.Authorization = 'Basic ' + authHeader;
		},
		/**
		 * Make an http request and add access token.
		 * @param {Object} options the options for $http call.
		 * @returns {Promise} promise.
		 */
		makeRequest: function(options) {
			var deferred = $q.defer();
			$http(options).success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(data);
			});
			return deferred.promise;
		}
	}
}]);

appServices.factory('$remember', function() {
	function fetchValue(name) {
		var gCookieVal = document.cookie.split("; ");
		for (var i=0; i < gCookieVal.length; i++)
		{
			// a name/value pair (a crumb) is separated by an equal sign
			var gCrumb = gCookieVal[i].split("=");
			if (name === gCrumb[0])
			{
				var value = '';
				try {
					value = angular.fromJson(gCrumb[1]);
				} catch(e) {
					value = unescape(gCrumb[1]);
				}
				return value;
			}
		}
		// a cookie with the requested name does not exist
		return null;
	}
	return function(name, values) {
		if(arguments.length === 1) return fetchValue(name);
		var cookie = name + '=';
		if(typeof values === 'object') {
			var expires = '';
			cookie += (typeof values.value === 'object') ? angular.toJson(values.value) + ';' : values.value + ';';
			if(values.expires) {
				var date = new Date();
				date.setTime( date.getTime() + (values.expires * 24 *60 * 60 * 1000));
				expires = date.toGMTString();
			}
			cookie += (!values.session) ? 'expires=' + expires + ';' : '';
			cookie += (values.path) ? 'path=' + values.path + ';' : '';
			cookie += (values.secure) ? 'secure;' : '';
		} else {
			cookie += values + ';';
		}
		document.cookie = cookie;
	}
});