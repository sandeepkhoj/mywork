'use strict';

/*
 *  Copyright (c) 2015, TopCoder, Inc. All rights reserved.
 */
/**
 * This file defines some shared constants and methods for this application.
 * @author duxiaoyang
 * @version 1.0
 */
angular.module('tholos.config', [])
    .constant('serviceBaseUri', 'http://52.3.10.233/ProdApi/')
    .constant('surveyStatusArray', ['Draft', 'Published', 'Closed'])
    .constant('roleMapping', {'Manager': 1, 'Participant': 2})
    .constant('managerUrls', ['landingManager', 'createSurvey', 'surveyDetails'])
    .constant('participantUrls', ['profileSurvey', 'landingParticipant', 'testPrototype', 'prototypeQuestion', 'postTestingQuestion', 'thankYou','closedSurvey']);

var app = angular.module('tholos',['ngRoute','ngSanitize','ngDragDrop','slick','ui.select','ui.date','flow','ui.slider','matchmedia-ng','LocalStorageModule','tholos.controllers','tholos.directives','tholos.services','tholos.filter','tholos.config']);

// Initialize the main module
app.run(['$rootScope', '$location', '$window', 'common', 'roleMapping', 'managerUrls', 'participantUrls',"localStorageService", function ($rootScope,$location,$window,common,roleMapping,managerUrls,participantUrls,localStorageService) {
    $rootScope.location = $location;
    // Logout and clear up all saved data.
    $rootScope.logout = function(check) {
        if(check) {
            $rootScope.currentUser = null;
            $rootScope.currentParticipant = null;
            $rootScope.authHeader = null;
            $rootScope.participantUsername = null;
            $rootScope.prototypeCode = null;
            $rootScope.prototypeTest = null;
            $rootScope.participantSurvey = null;
            $rootScope.completed = false;
            sessionStorage.clear();
            localStorageService.clearAll();
            $location.path("/");
        }
        else if (window.confirm("Are you sure you want to logout?") ) {
            $rootScope.currentUser = null;
            $rootScope.currentParticipant = null;
            $rootScope.authHeader = null;
            $rootScope.participantUsername = null;
            $rootScope.prototypeCode = null;
            $rootScope.prototypeTest = null;
            $rootScope.participantSurvey = null;
            $rootScope.completed = false;
            sessionStorage.clear();
            localStorageService.clearAll();
            $location.path("/");
        }
    };
    $rootScope.goto = function (path) {
        $rootScope.isExpand = false;
        if (path === 'back') { // Allow a 'back' keyword to go to previous page
            $window.history.back();
        }else { // Go to the specified path
            $location.path(path);
        }
    };
    // Converts date time from .NET format to JS format.
    $rootScope.convertDateTime = function(dateTime) {
        var epoch = dateTime.replace('/Date(', '');
        return new Date(parseInt(epoch));
    };
    // Processes range question which is used to generate markers and values.
    $rootScope.processRangeQuestion = function(questions) {
        angular.forEach(questions, function(item) {
            if (item.QuestionType === 1) {
                item.AnswerOptions[0].Values = [];
                if (item.AnswerOptions[0].FromValue < item.AnswerOptions[0].ToValue) {
                    for (var i = item.AnswerOptions[0].FromValue; i <= item.AnswerOptions[0].ToValue; i += Math.abs(item.AnswerOptions[0].Increment)) {
                        item.AnswerOptions[0].Values.push(i);
                    }
                } else {
                    for (var i = item.AnswerOptions[0].FromValue; i >= item.AnswerOptions[0].ToValue; i -= Math.abs(item.AnswerOptions[0].Increment)) {
                        item.AnswerOptions[0].Values.push(i);
                    }
                }
                item.AnswerOptions[0].Increment = Math.abs(item.AnswerOptions[0].Increment);
                item.Value = item.AnswerOptions[0].FromValue < item.AnswerOptions[0].ToValue ? item.AnswerOptions[0].FromValue : item.AnswerOptions[0].ToValue;
            }
            if (item.QuestionType === 2) {
                item.CheckedItems = [];
            }
        });
        return questions;
    };
    // Listens to location change event to handle authentication and redirect.
    $rootScope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
        if (sessionStorage.getItem('currentUser')) {
            // manager user
            var user = JSON.parse(sessionStorage.getItem('currentUser'));
            var isManager = false;
            for (var i in user.Roles) {
                if (user.Roles[i].Id === roleMapping['Manager']) {
                    isManager = true;
                    break;
                }
            }
            if (!isManager) {
                event.preventDefault();
                $location.path('/');
                return;
            } else {
                var authenticated = false;
                for (var i in managerUrls) {
                    if (newUrl.indexOf(managerUrls[i]) >= 0) {
                        authenticated = true;
                        break;
                    }
                }
                if (!authenticated) {
                    event.preventDefault();
                    $rootScope.logout(true);
                    $location.path('/');
                    return;
                }
            }
            $rootScope.currentUser = user;
            $rootScope.authHeader = sessionStorage.getItem('authHeader');
            common.setAuthHeader($rootScope.authHeader);
        } else if (sessionStorage.getItem('participantUsername')) {
            // participant user
            var authenticated = false;
            for (var i in participantUrls) {
                if (newUrl.indexOf(participantUrls[i]) >= 0) {
                    authenticated = true;
                    break;
                }
            }
            if (!authenticated) {
                event.preventDefault();
                $rootScope.logout(true);
                $location.path('/');
                return;
            }
            $rootScope.authHeader = sessionStorage.getItem('authHeader');
            common.setAuthHeader($rootScope.authHeader);
            $rootScope.participantUsername = sessionStorage.getItem('participantUsername');
        } else {
            // otherwise, redirect to home page
            $rootScope.logout(true);
            $location.path('/');
        }
    });
}]);

// Configures the route.
app.config(["$routeProvider","$locationProvider",
    function($routeProvider){
        $routeProvider
            .when("/",{
                templateUrl: "views/login.html",
								controller: 'loginCtrl'
            })
						.when("/landingManager",{
                templateUrl: "views/manager/landing.html",
								controller: 'landingManagerCtrl'
            })
						.when("/createSurvey",{
                templateUrl: "views/manager/create-survey.html",
								controller: 'createSurveyCtrl'
            })
						.when("/surveyDetails",{
                templateUrl: "views/manager/survey-details.html",
								controller: 'surveyDetailsCtrl'
            })
						.when("/surveyDetails/:id",{
                templateUrl: "views/manager/survey-details.html",
								controller: 'surveyDetailsCtrl'
            })
						.when("/profileSurvey",{
                templateUrl: "views/participant/profile-survey.html",
								controller: 'profileSurveyCtrl'
            })
						.when("/landingParticipant",{
                templateUrl: "views/participant/landing.html",
								controller: 'landingParticipantCtrl'
            })
						.when("/testPrototype",{
                templateUrl: "views/participant/test-prototype.html",
								controller: 'testPrototypeCtrl'
            })
						.when("/prototypeQuestion",{
                templateUrl: "views/participant/prototype-questions.html",
								controller: 'prototypeQuestionCtrl'
            })
						.when("/postTestingQuestion",{
                templateUrl: "views/participant/post-testing-questions.html",
								controller: 'postTestingQuestionCtrl'
            })
						.when("/thankYou",{
                templateUrl: "views/participant/thank-you.html",
								controller: 'thankYouCtrl'
            }).when("/closedSurvey",{
                templateUrl: "views/participant/closed-survey.html",
                controller: 'closedsurveyCtrl'
            });
    }
]);

// Configures flow plugin.
app.config(['flowFactoryProvider', function (flowFactoryProvider) {
    flowFactoryProvider.factory = fustyFlowFactory;
}]);

app.config(function (localStorageServiceProvider) {
    localStorageServiceProvider
        .setPrefix('myApp')
        .setStorageType('sessionStorage')
});
