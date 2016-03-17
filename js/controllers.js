'use strict';

/*
 *  Copyright (c) 2015, TopCoder, Inc. All rights reserved.
 */
/**
 * This file defines the controllers for this application.
 * @author duxiaoyang
 * @version 1.0
 */
var appControllers = angular.module('tholos.controllers', []);

var sortQuestions = function (questions) {
    questions.sort(function (a, b) {
        return (a.RelationshipLabel > b.RelationshipLabel ? 1 : -1);
    });
};

var fillDependantSort = function (questions) {
    for (var questionIdx = 0 ; questionIdx < questions.length ; ++questionIdx) {
        var question = questions[questionIdx];
        var questionId = question.Question == undefined ? question.Id : question.Question.Id;
        var condition = question.Question == undefined ? question.Condition : question.Question.Condition;
        
        if (condition != undefined) {
            var questionIdIsDependant = questionId;
            var questionIdHasDependant = condition.ConditionalOnQuestionId;

            // Is dependant
            question.BelongsToQuestionId = questionIdHasDependant;

            for (var innerIdx = 0 ; innerIdx < questions.length ; ++innerIdx) {
                var innerQuestion = questions[innerIdx];
                var innerQuestionId = innerQuestion.Question == undefined ? innerQuestion.Id : innerQuestion.Question.Id;
                if (innerQuestionId == questionIdHasDependant) {
                    if (innerQuestion.DependantQuestionsId == undefined) {
                        // Has dependant
                        innerQuestion.DependantQuestionsId = [];
                    }

                    if ($.inArray(questionIdIsDependant, innerQuestion.DependantQuestionsId) == -1) {
                        innerQuestion.DependantQuestionsId.push(questionIdIsDependant);
                    }
                }
            }

        }
    }

    sortQuestions(questions);
};

// Welcome Controller
appControllers.controller('page',function($scope,$rootScope,$location,$q,$timeout,$filter,common,serviceBaseUri, localStorageService){
	$scope.global = {
		logged: false,
		headLess: false,
		footerLess: false
	};
	$scope.resetGlobal = function(options){
		options = options || {};
		$scope.global.logged = options.logged || false;
		$scope.global.headLess = options.headLess || false;
		$scope.global.footerLess = options.footerLess || false;
	};
	// Helper for drag-and-drop.
	$scope.helper = function(){
		$('body').append('<div id="clone" class="cartridge">' + $(this)[0].outerHTML + '</div>');
		$('#clone').hide();
		setTimeout(
			function(){
				$('#clone').appendTo('body'); 
				$('#clone').show();
			},0
		);
		return $('#clone');
	};
	// Handle drag start event.
	$scope.onStart = function(event,ui,item,index,prototypeQuestions,postTestingQuestions){
		$(event.target).addClass('ui-draggable-dragging');
		$scope.draggingQuestions = [item.Id];
		if(item.Conditional){
			var question = item;
			while (question && question.Conditional) {
				if (index === 1) {
					question = $filter('filter')(prototypeQuestions, function(value,index,arr){return value.Id === question.Condition.ConditionalOnQuestionId})[0];
				} else {
					question = $filter('filter')(postTestingQuestions, function(value,index,arr){return value.Id === question.Condition.ConditionalOnQuestionId})[0];
				}
				if (question) {
					$scope.draggingQuestions.push(question.Id);
				}
			}
			$(ui.helper).empty();
			angular.forEach($scope.draggingQuestions, function(id) {
				$(event.target).parent().find('[data-id="' + id + '"]').addClass('ui-draggable-dragging');
				$(ui.helper).append($(event.target).parent().find('[data-id="' + id + '"]')[0].outerHTML);
			});
		}
	};
	// Handle drag stop event.
	$scope.onStop = function(event,ui,item){
		setTimeout(
			function(){
				$(event.target).removeClass('ui-draggable-dragging');
				if(item.Conditional){
					$(event.target).parent().find('.ui-draggable-dragging').removeClass('ui-draggable-dragging');
				}
			},200
		);
	};

	// Handle drop event.
	$scope.beforeDrop = function(item,ui,index,prototypeQuestions,selectedPrototypeQuestions,postTestingQuestions,selectedPostTestingQuestions){
		var deferred = $q.defer();
		deferred.reject();
		$('.ui-draggable-dragging').removeClass('ui-draggable-dragging');
		if(index === 1){
			$scope.$watch('selectedPrototypeQuestions',function(newValue,oldValue){
				angular.forEach($scope.draggingQuestions, function(id) {
					var question = $filter('filter')(prototypeQuestions, function(value,index,arr){return value.Id === id})[0];
					selectedPrototypeQuestions.push(question);
					prototypeQuestions.splice(prototypeQuestions.indexOf(question), 1);

					sortQuestions(selectedPrototypeQuestions);
					sortQuestions(prototypeQuestions);
				});
			});
		}else{
			$scope.$watch('selectedPostTestingQuestions',function(newValue,oldValue){
				angular.forEach($scope.draggingQuestions, function(id) {
					var question = $filter('filter')(postTestingQuestions, function(value,index,arr){return value.Id === id})[0];
					selectedPostTestingQuestions.push(question);
					postTestingQuestions.splice(postTestingQuestions.indexOf(question), 1);

					sortQuestions(selectedPostTestingQuestions);
					sortQuestions(postTestingQuestions);
				});
			});
		}


		return deferred.promise;
	};
	// Trigger deleting prototype question modal.
	$scope.triggerModal = function(index,selectedPrototypeQuestions){
		for(var i = 0;i < selectedPrototypeQuestions.modal.length;i++){
			selectedPrototypeQuestions.modal[i] = false;	
		}
		selectedPrototypeQuestions.modal[index] = true;
	};
	// Trigger deleting post testing question modal.
	$scope.triggerPostModal = function(index,selectedPostTestingQuestions){
		for(var i = 0;i < selectedPostTestingQuestions.modal.length;i++){
			selectedPostTestingQuestions.modal[i] = false;	
		}
		selectedPostTestingQuestions.modal[index] = true;
	};
	// Close deleting prototype question modal.
	$scope.triggerOffModal = function(index,selectedPrototypeQuestions){
		selectedPrototypeQuestions.modal[index] = false;
	};
	// Close deleting post testing question modal.
	$scope.triggerOffPostModal = function(index,selectedPostTestingQuestions){
		selectedPostTestingQuestions.modal[index] = false;
	};
	// Delete prototype question.
	$scope.deleteQst = function(index,prototypeQuestions,selectedPrototypeQuestions){
		var _array = selectedPrototypeQuestions.splice(index,1);
		prototypeQuestions.push(_array[0]);

		$scope.triggerOffModal(index, selectedPrototypeQuestions);

	    sortQuestions(selectedPrototypeQuestions);
	    sortQuestions(prototypeQuestions);
	};
	// Delete post testing question.
	$scope.deletePostQst = function(index,postTestingQuestions,selectedPostTestingQuestions){
		var _array = selectedPostTestingQuestions.splice(index,1);
		postTestingQuestions.push(_array[0]);

		$scope.triggerOffPostModal(index, selectedPostTestingQuestions);

		sortQuestions(selectedPostTestingQuestions);
		sortQuestions(postTestingQuestions);
	};
	// Submit an answer.
	$scope.submitAnswer = function(url,question,next) {

		if(angular.isUndefined($rootScope.prototypeTest)) {
			$rootScope.prototypeTest = JSON.parse(localStorageService.get('prototypeTest'));
			$rootScope.participantSurvey = JSON.parse(localStorageService.get('participantSurvey'));
		}

		var answers = [], answer = null, serviceUri = null;
		if (question.QuestionType === 0) {
			if (question.AnswerOptions[0].Type === 0) {
				answer = {
					__type: "SingleAnswer:#Tholos.Entities",
					AnswerOptionId: question.Checked,
					QuestionId: question.Id,
					AnswerType: question.AnswerOptions[0].Type
				}
			} else {
				answer = {
					__type: "SingleInputAnswer:#Tholos.Entities",
					AnswerOptionId: question.AnswerOptions[0].Id,
					Input: question.Input,
					QuestionId: question.Id,
					AnswerType: question.AnswerOptions[0].Type
				}
			}
		}
		if (question.QuestionType === 1) {
			answer = {
				__type: "RangeAnswer:#Tholos.Entities",
				Value: question.AnswerOptions[0].FromValue < question.AnswerOptions[0].ToValue ? question.Value : question.AnswerOptions[0].FromValue - (question.Value - question.AnswerOptions[0].ToValue),
				QuestionId: question.Id,
				AnswerType: question.AnswerOptions[0].Type
			}
		}
		if (answer !== null) {
			answers.push(answer);
		}

		if (question.QuestionType === 2) {
			angular.forEach(question.AnswerOptions, function(currentAnswer) {
				if (currentAnswer.Checked){
					answer = {
						__type: "MultipleAnswer:#Tholos.Entities",
						QuestionId: currentAnswer.QuestionId,
						AnswerType: currentAnswer.Type,
						AnswerOptionId: currentAnswer.Id
					};
					answers.push(answer);
				}
			});
		}

		if (question.AnswerId) {
			answer.Id = question.AnswerId;
			common.makeRequest({
				method: 'PUT',
				url: serviceBaseUri + 'ParticipantSurveyService.svc/' + url,
				data: answers
			}).then(next);
		} else if(url == "PrototypeAnswers") {
			common.makeRequest({
				method: 'POST',
				url: serviceBaseUri + 'ParticipantSurveyService.svc/PrototypeTests/' + $rootScope.prototypeTest.Id + '/' + url,
				data: answers
			}).then(next);
		}
		else {

			common.makeRequest({
				method: 'POST',
				url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.participantSurvey.Id + '/' + url,
				data: answers
			}).then(next);
		}
	};
});

// Login Controller
appControllers.controller('loginCtrl',function($scope,$rootScope,common,$location,$filter,serviceBaseUri,roleMapping,localStorageService,$remember){
	$scope.resetGlobal({
		logged: false,
		headLess: false,
		footerLess: true
	});
	$scope.remember = false;
	$scope.login = {};
	if ($remember('username') && $remember('password') ) {
		$scope.remember = true;
		$scope.login.username = $remember('username');
		$scope.login.password = $remember('password');
	}
	//Get Username & Password from inputs

	$scope.error = {
		flag: false,
		infor: ''	
	};
	$scope.logout(true);



	// Validate and login.
	$scope.valdate = function(){
		if($scope.loginForm.$invalid){
			$scope.error = {
				flag : true,
				infor : 'Please enter Username and Password!'
			}
		}else{

			var auth = common.setCredentials($scope.login.username, $scope.login.password);
			$rootScope.authHeader = auth;
			localStorageService.set('username',$scope.login.username);
			localStorageService.set('authHeader',auth);
			sessionStorage.setItem('authHeader', auth);
			var promise = common.makeRequest({
				method: "GET",
				url: serviceBaseUri + "UserService.svc/Users/Params?username=" + $scope.login.username
			});
			promise.then(function(user) {
				if ($scope.remember) {
					$remember('username', $scope.login.username);
					$remember('password', $scope.login.password);
				} else {
					$remember('username', '');
					$remember('password', '');
				}
				if (user !== "") {

					$rootScope.currentUser = user;
					localStorageService.set('currentUser',JSON.stringify($rootScope.currentUser));
					sessionStorage.setItem('currentUser', JSON.stringify($rootScope.currentUser));
					for (var i in user.Roles) {
						if (user.Roles[i].Id === roleMapping['Manager']) {
							$location.path('/landingManager');
							return;
						}
					}
					$scope.error = {
						flag: true,
						infor: 'User is not authorized to login.'
					}
				} else {
					// user is a participant
					var participantPromise = common.makeRequest({
						method: 'GET',
						url: serviceBaseUri + 'ParticipantService.svc/Participants/params?username=' + $scope.login.username
					});
					participantPromise.then(function(data) {
						console.log(data);
						if (data === "") {
							$rootScope.participantUsername = $scope.login.username;
							localStorageService.set('participantUsername',$scope.login.username);
							sessionStorage.setItem('participantUsername', $scope.login.username);
							$location.path('/profileSurvey');
						} else {
							$rootScope.participantUsername = $scope.login.username;
							localStorageService.set('participantUsername',$scope.login.username);
							sessionStorage.setItem('participantUsername', $scope.login.username);
							$rootScope.currentParticipant = data;
							localStorageService.set('currentParticipant',JSON.stringify(data));
							sessionStorage.setItem('currentParticipant', JSON.stringify(data));
							// this survey is closed
							if (data.SurveyStatus == 2){
								$location.path('/closedSurvey');
							}
							else {
								$location.path('/landingParticipant');
							}
						}
					});
				}
			}, function(err) {
				$scope.error = {
					flag : true,
					infor: err.ErrorMessage
				}
			});
		}
	};
});
appControllers.$inject = ['$scope', '$filter'];
// Landing Controller
appControllers.controller('landingManagerCtrl',function($scope,$rootScope,common,$filter,matchmedia,serviceBaseUri,surveyStatusArray){
	$scope.resetGlobal({
		logged: true,
		headLess: true,
		footerLess: true
	});
	$scope.slider =  {};
	$scope.slider.show = 4;
	$scope.phone = matchmedia.isPhone();
	if($scope.phone){
		$scope.slider.show = 1;
	}
	$scope.surveys = [];
	$scope.filter = {};
	$scope.quickAccessSurveys = [];

	$scope.itemsPerPage = 10;
	$scope.currentPage = 0;
	$scope.pagedItems = [];
	$scope.gap = 5;
	$scope.sort = {
		sortingOrder : 'StatusText',
		reverse : false
	};

	// calculate page in place
	$scope.groupToPages = function () {
		$scope.pagedItems = [];

		for (var i = 0; i < $scope.surveys.length; i++) {
			if (i % $scope.itemsPerPage === 0) {
				$scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.surveys[i] ];
			} else {
				$scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.surveys[i]);
			}
		}
		console.log($scope.pagedItems);
	};

	$scope.range = function (size,start, end) {
		var ret = [];
		console.log(size,start, end);

		if (size < end) {
			end = size;
			start = size-$scope.gap > 0 ? size-$scope.gap : 0;
		}
		for (var i = start; i < end; i++) {
			ret.push(i);
		}
		console.log(ret);
		return ret;
	};

	$scope.prevPage = function () {
		if ($scope.currentPage > 0) {
			$scope.currentPage--;
		}
	};

	$scope.nextPage = function () {
		if ($scope.currentPage < $scope.pagedItems.length - 1) {
			$scope.currentPage++;
		}
	};

	$scope.setPage = function () {
		$scope.currentPage = this.n;
	};

	var searchMatch = function (haystack, needle) {
		if(haystack != null) {
			if (!needle) {
				return true;
			}
			console.log(needle);
			return haystack.toString().toLowerCase().indexOf(needle.toLowerCase()) !== -1;
		}
		else {
			return false;
		}
	};

	// init the filtered items
	$scope.search = function () {
		$scope.filteredItems = $filter('filter')($scope.surveys, function (item) {

			for(var attr in item) {

				if (searchMatch(item[attr], $scope.query))
					return true;
			}
			return false;
		});
		// take care of the sorting order
		if ($scope.sort.sortingOrder !== '') {
			$scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sort.sortingOrder, $scope.sort.reverse);
		}
		$scope.currentPage = 0;
		// now group by pages
		$scope.pagedItems = [];

		for (var i = 0; i < $scope.filteredItems.length; i++) {
			if (i % $scope.itemsPerPage === 0) {
				$scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
			} else {
				$scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
			}
		}
		console.log($scope.pagedItems);
	};

	// Get my status
	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'SurveyService.svc/Users/' + $rootScope.currentUser.Id + '/SurveyStatus'
	}).then(function(data) {
		$scope.myStatus = {closed: 0, published: 0, draft: 0};
		var value = $filter('filter')(data, {Key: 2});
		if (value.length) {
			$scope.myStatus.closed = value[0].Value;
		}
		value = $filter('filter')(data, {Key: 1});
		if (value.length) {
			$scope.myStatus.published = value[0].Value;
		}
		value = $filter('filter')(data, {Key: 0});
		if (value.length) {
			$scope.myStatus.draft = value[0].Value;
		}
	});
	// Get surveys
	common.makeRequest({
		method: 'POST',
		url: serviceBaseUri + 'SurveyService.svc/Surveys/GetAll?all=true',
		data: {PageNumber: 0, PageSize: 0}
	}).then(function(data) {
		var surveyArray = [];
		for (var i in data.Records) {
			surveyArray = surveyArray.concat(data.Records[i].Value);
		}
		$scope.surveys = updateSurveyFields(surveyArray, $scope.quickAccessSurveys);
		$scope.filteredItems = $scope.surveys;

		if ($scope.sort.sortingOrder !== '') {
			$scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sort.sortingOrder, $scope.sort.reverse);
		}
		$scope.currentPage = 0;
		// now group by pages
		$scope.pagedItems = [];

		for (var i = 0; i < $scope.filteredItems.length; i++) {
			if (i % $scope.itemsPerPage === 0) {
				$scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
			} else {
				$scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
			}
		}
		console.log($scope.pagedItems);

	});
	// Get quick access surveys
	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'SurveyService.svc/Users/' + $rootScope.currentUser.Id + '/QuickAccessSurveys'
	}).then(function(data) {
		$scope.surveys = updateSurveyFields($scope.surveys, data);
		$scope.quickAccessSurveys = data;
	});
	// Update survey fields
	var updateSurveyFields = function(surveys, quickAccessSurveys) {
		var newSurveys = [];
		for (var i in surveys) {
			var found = false;
			var survey = surveys[i];
			for (var j in quickAccessSurveys) {
				if (survey.Id === quickAccessSurveys[j].SurveyId) {
					survey.QuickAccess = true;
					found = true;
				}
			}
			if (!found) {
				survey.QuickAccess = false;
			}
			survey.StatusText = surveyStatusArray[survey.Status];
			survey.Date = $rootScope.convertDateTime(survey.DateCreated);
			newSurveys.push(survey);
		}
		return newSurveys;
	};
	// Filter quick access.
	$scope.filterQuickAccess = function(quickAccessSurveys) {
		return function(survey) {
			if ($scope.quick.edit) {
				return true;
			}
			for (var i in quickAccessSurveys) {
				if (survey.Id === quickAccessSurveys[i].SurveyId) {
					return true;
				}
			}
			return false;
		}
	};
	// Trigger ordering.
	$scope.triggerOrder = function(order){
		if($scope.sort.sortingOrder === order){
			$scope.sort.sortingOrder = '-' + order;
		}else{
			$scope.sort.sortingOrder = order;
		}
		$scope.search();
	};
	// Switch grid/list view.
	$scope.switch = function(tab){
		$scope.view = tab;
		$scope.applyClosed(function(){});
		$scope.applyPublished(function(){});
		$scope.slickDraft(function(){});
	};
	// Quick access
	$scope.quick = {};
	$scope.quick.selected = true;
	// Edit quick access.
	$scope.editQuick = function(){
		$scope.quick.edit = true;
		$scope.quick.selected = '';	
		$scope._surveys = angular.copy($scope.surveys);
	};
	// Cancel quick access editing.
	$scope.cancelQuick = function(){
		$scope.quick.edit = false;
		$scope.quick.selected = true;	
		$scope.surveys = angular.copy($scope._surveys);	
	};
	// Done quick access editing.
	$scope.doneQuick = function(){
		$scope.quickAccessSurveys = [];
		var position = 1;
		for (var i in $scope.surveys) {
			var survey = $scope.surveys[i];
			if (survey.QuickAccess) {
				var quickAccess = {SurveyId: survey.Id, Position: position++};
				$scope.quickAccessSurveys.push(quickAccess);
			}
		}
		common.makeRequest({
			method: 'PUT',
			url: serviceBaseUri + 'SurveyService.svc/Users/' + $rootScope.currentUser.Id + '/QuickAccessSurveys',
			data: $scope.quickAccessSurveys
		}).then(null, function(err) {
			alert("Error occurred!");
		});
		$scope.quick.edit = false;
		$scope.quick.selected = true;
	};
});

// Create Survey Controller
appControllers.controller('createSurveyCtrl',function($scope,$rootScope,$location,common,serviceBaseUri){
	$scope.resetGlobal({
		logged: true,
		headLess: true,
		footerLess: true
	});
	// Validation Form
	$scope.step = {};
	$scope.step.index = 1;
	// Validate form.
	$scope.validationForm = function(){
		$scope.step.error = false;
		$scope.step.codeMatching = true;
		$scope.step.positive = true;
		$scope.submitted = true;
		if($scope.surveyDetailsForm.$invalid){
			$scope.step.error = true;
		}
		if ($scope.numOfPart <= 0) {
			$scope.step.error = true;
			$scope.step.positive = false;
			$scope.surveyDetailsForm.numOfPart.$invalid = true;
		}
		angular.forEach($scope.code, function(item, i) {
			$scope.surveyDetailsForm["code" + i].$invalid = false;
			$scope.surveyDetailsForm["num" + i].$invalid = false;
			if (($.trim(item.name) !== "" && $.trim($scope.preCode[i].name)) === "" || ($.trim(item.name) === "" && $.trim($scope.preCode[i].name) !== "")) {
				$scope.step.error = true;
				$scope.step.codeMatching = false;
				$scope.surveyDetailsForm["code" + i].$invalid = true;
				$scope.surveyDetailsForm["num" + i].$invalid = true;
			}
			if ($scope.preCode[i].name == '0') {
				$scope.step.error = true;
				$scope.step.positive = false;
				$scope.surveyDetailsForm["num" + i].$invalid = true;
			}
		});
		if (!$scope.step.error) {
			$scope.step.index = 2;
		}

		$(window).scrollTop(0);
	};
	// Save draft survey.
	$scope.saveDraft = function(){
		$scope.step.error = false;
		$scope.step.codeMatching = true;
		$scope.step.positive = true;
		$scope.submitted = true;
		if($scope.surveyDetailsForm.$invalid){
			$scope.step.error = true;
		}
		if ($scope.numOfPart <= 0) {
			$scope.step.error = true;
			$scope.step.positive = false;
			$scope.surveyDetailsForm.numOfPart.$invalid = true;
		}
		angular.forEach($scope.code, function(item, i) {
			$scope.surveyDetailsForm["code" + i].$invalid = false;
			$scope.surveyDetailsForm["num" + i].$invalid = false;
			if (($.trim(item.name) !== "" && $.trim($scope.preCode[i].name)) === "" || ($.trim(item.name) === "" && $.trim($scope.preCode[i].name) !== "")) {
				$scope.step.error = true;
				$scope.step.codeMatching = false;
				$scope.surveyDetailsForm["code" + i].$invalid = true;
				$scope.surveyDetailsForm["num" + i].$invalid = true;
			}
			if ($scope.preCode[i].name == '0') {
				$scope.step.error = true;
				$scope.step.positive = false;
				$scope.surveyDetailsForm["num" + i].$invalid = true;
			}
		});
		if (!$scope.step.error) {
			saveSurvey(true).then(function(data) {
				$location.path('/surveyDetails/' + data);
			});
		}
	};
	// Back to previous page.
	$scope.back = function(){
		$scope.step.index--;
		$(window).scrollTop(0);
	};


	$scope.pager = function(i){
		$scope.step.index = i;
		$(window).scrollTop(0);
	};

	// Go to next page.
	$scope.next = function(){
		$scope.step.index++;
		$(window).scrollTop(0);
	};
	$scope.code = [{
		name: ''	
	}];
	$scope.preCode = [{
		name: ''	
	}];
	$scope.prototypeQuestions = [];
	$scope.postTestingQuestions = [];
	$scope.selectedPrototypeQuestions = [];
	$scope.selectedPostTestingQuestions = [];
	$scope.selectedPrototypeQuestions.modal = [];
	$scope.selectedPostTestingQuestions.modal = [];
	// Add prototype code field.
	$scope.addFields = function(){
		$scope.code.push({name: ''});	
		$scope.preCode.push({name: ''});	
	}
	// Get prototype questions.
	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'SurveyService.svc/PrototypeQuestions'
	}).then(function(data) {
	    $scope.prototypeQuestions = data;
	    fillDependantSort($scope.prototypeQuestions);
	});
	// Get post testing questions.
	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'SurveyService.svc/PostTestingQuestions'
	}).then(function(data) {
	    $scope.postTestingQuestions = data;
	    fillDependantSort($scope.postTestingQuestions);
	});
	// Publish survey.
	$scope.publish = function(){
		var promise = saveSurvey(false);
		promise.then(function(data) {
			window.alert('The Survey has been published successfully');
			$location.path('/landingManager');
		});
	};
	// Filter for field which is not empty.
	$scope.filterNotEmpty = function(name) {
		return function(value) {
			return $.trim(value[name]) != "";
		}
	};
	/**
	 * Save survey.
	 * @param {Boolean} true if the survey is draft; or false otherwise.
	 */
	var saveSurvey = function(draft) {
		$scope.step.error = false;
		$scope.submitted = true;
		if($scope.surveyDetailsForm.$invalid){
			$scope.step.error = true;
		}else{
			var survey = {
				Name: $scope.surveyName,
				CellName: $scope.cell,
				ParticipantsNumber: $scope.numOfPart,
				PrototypeCodes: [],
				Status: draft ? 0 : 1,
				CompletedSurveysNumber: 0,
				Draft: draft,
				PrototypeQuestions: [],
				PostTestingQuestions: []
			};
			angular.forEach($scope.code, function(item, i) {
				if ($.trim(item.name) !== "") {
					var code = {Code: $.trim(item.name)};
					if ($.trim($scope.preCode[i].name) !== "") {
						code.PrototypesPerCode = parseInt($.trim($scope.preCode[i].name));
					} else {
						code.PrototypesPerCode = 0;
					}
					survey.PrototypeCodes.push(code);
				}
			});
			angular.forEach($scope.selectedPrototypeQuestions, function(item, i) {
				var question = {Question: {Id: item.Id}, Position: i + 1};
				survey.PrototypeQuestions.push(question);
			});
			angular.forEach($scope.selectedPostTestingQuestions, function(item, i) {
				var question = {Question: {Id: item.Id}, Position: i + 1};
				survey.PostTestingQuestions.push(question);
			});
			return common.makeRequest({
				method: 'POST',
				url: serviceBaseUri + '/SurveyService.svc/Surveys/Create?userId=' + $rootScope.currentUser.Id,
				data: survey
			});
		}
	};
});

// Survey Details Controller
appControllers.controller('surveyDetailsCtrl',function($scope,$rootScope,common,$routeParams,$filter,$location,$route,$q,serviceBaseUri,surveyStatusArray){
	$scope.resetGlobal({
		logged: true,
		headLess: true,
		footerLess: true
	});
	$scope.prototypeQuestions = [];
	$scope.postTestingQuestions = [];
	$scope.edit = {};
	// Add prototype code field.
	$scope.addFields = function(){
		$scope._survey.PrototypeCodes.push({Code: '', PrototypesPerCode: ''});	
	}
	// Get questions
	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'SurveyService.svc/PrototypeQuestions'
	}).then(function(data) {
		$scope.prototypeQuestions = data;
		return common.makeRequest({
			method: 'GET',
			url: serviceBaseUri + 'SurveyService.svc/PostTestingQuestions'
		});
	}).then(function(data) {
		$scope.postTestingQuestions = data;
		return common.makeRequest({
			method: 'GET',
			url: serviceBaseUri + 'SurveyService.svc/Surveys/' + $routeParams.id
		});
	}).then(function(data) {
		$scope.survey = data;
		$scope.survey.StatusText = surveyStatusArray[$scope.survey.Status];
		$scope.survey.Date = $rootScope.convertDateTime($scope.survey.DateCreated);
		if (!$scope.survey.PrototypeCodes || $scope.survey.PrototypeCodes.length == 0) {
			$scope.survey.PrototypeCodes.push({Code: '', PrototypesPerCode: ''});
		}

		fillDependantSort($scope.survey.PostTestingQuestions);
		fillDependantSort($scope.survey.PrototypeQuestions);
        
		var prototypeQuestions = $scope.survey.PrototypeQuestions;

	});
	// Download participants list.
	$scope.downloadParticipants = function() {
		var url = serviceBaseUri + 'SurveyService.svc/Surveys/' + $scope.survey.Id + '/ExportParticipantCredentials';
		window.open(url);
	};

	$scope.downloadResult = function() {
		console.log($scope.survey.Id);
		var url = serviceBaseUri + 'SurveyService.svc/Surveys/' + $scope.survey.Id + '/ExportSurveyResults';
		window.open(url);
	}

	// Publish survey.
	$scope.publish = function(){
		common.makeRequest({
			method: 'PUT',
			url: serviceBaseUri + 'SurveyService.svc/Surveys/' + $scope.survey.Id + '/Publish'
		}).then(function(data) {
			window.alert('The Survey has been published successfully');
			$location.path('/landingManager');
		});
	};
	// Close survey.
	$scope.close = function(){
		common.makeRequest({
			method: 'PUT',
			url: serviceBaseUri + 'SurveyService.svc/Surveys/' + $scope.survey.Id + '/UpdateSurvey?status=2'
		}).then(function(data) {
			window.alert('The Survey has been closed successfully');
			$location.path('/landingManager');
		});
	};
	// Start editing survey.
	$scope.edit = function(){
		$scope.editStatus = true;
		$scope._survey = angular.copy($scope.survey);
		$scope.edit.prototypeQuestions = angular.copy($scope.prototypeQuestions);
		$scope.edit.postTestingQuestions = angular.copy($scope.postTestingQuestions);
		$scope.edit.selectedPrototypeQuestions = [];
		$scope.edit.selectedPostTestingQuestions = [];
		$scope.edit.selectedPrototypeQuestions.modal = [];
		$scope.edit.selectedPostTestingQuestions.modal = [];
		angular.forEach($scope.survey.PrototypeQuestions, function(item) {
			$scope.edit.selectedPrototypeQuestions.push(item.Question);
			for (var i in $scope.edit.prototypeQuestions) {
				if ($scope.edit.prototypeQuestions[i].Id === item.Question.Id) {
					$scope.edit.prototypeQuestions.splice(i, 1);
					break;
				}
			}
		});
		angular.forEach($scope.survey.PostTestingQuestions, function(item) {
			$scope.edit.selectedPostTestingQuestions.push(item.Question);
			for (var i in $scope.edit.postTestingQuestions) {
				if ($scope.edit.postTestingQuestions[i].Id === item.Question.Id) {
					$scope.edit.postTestingQuestions.splice(i, 1);
					break;
				}
			}
		});

		fillDependantSort($scope.edit.prototypeQuestions);
		fillDependantSort($scope.edit.postTestingQuestions);

		fillDependantSort($scope.edit.selectedPrototypeQuestions);
		fillDependantSort($scope.edit.selectedPostTestingQuestions);
	};
	// Cancel survey editing.
	$scope.cancel = function(){
		$scope.editStatus = false;
	};
	// Update survey.
	$scope.update = function(){
		$scope.codeMatching = true;
		$scope.submitted = true;
		$scope.positive = true;
		var error = false;
		if($scope.editSurveyForm.$invalid){
			error = true;
		}else{
			angular.forEach($scope._survey.PrototypeCodes, function(item, i) {
				if (($.trim(item.Code) !== "" && $.trim(item.PrototypesPerCode) === "") || ($.trim(item.Code) === "" && $.trim(item.PrototypesPerCode) !== "")) {
					error = true;
					$scope.editSurveyForm['code' + i].$invalid = true;
					$scope.editSurveyForm['num' + i].$invalid = true;
					$scope.codeMatching = false;
				}
				if (item.PrototypesPerCode == "0") {
					error = true;
					$scope.editSurveyForm['num' + i].$invalid = true;
					$scope.positive = false;
				}
			});
		}
		if (error) {
			$(window).scrollTop(0);
			return;
		}
		
		$scope.editStatus = false;
		var survey = {
			Id: $scope.survey.Id,
			Name: $scope._survey.Name,
			CellName: $scope._survey.CellName,
			ParticipantsNumber: $scope._survey.ParticipantsNumber,
			PrototypeCodes: [],
			Status: $scope._survey.Status,
			CompletedSurveysNumber: $scope.CompletedSurveysNumber,
			Draft: $scope.survey.Draft,
			PrototypeQuestions: [],
			PostTestingQuestions: []
		};
		angular.forEach($scope._survey.PrototypeCodes, function(item, i) {
			if ($.trim(item.Code) !== "") {
				var code = {Code: $.trim(item.Code), PrototypesPerCode: parseInt(item.PrototypesPerCode)};
				survey.PrototypeCodes.push(code);
			}
		});
		angular.forEach($scope.edit.selectedPrototypeQuestions, function(item, i) {
			var question = {Question: {Id: item.Id}, Position: i + 1};
			survey.PrototypeQuestions.push(question);
		});
		angular.forEach($scope.edit.selectedPostTestingQuestions, function(item, i) {
			var question = {Question: {Id: item.Id}, Position: i + 1};
			survey.PostTestingQuestions.push(question);
		});
		common.makeRequest({
			method: 'PUT',
			url: serviceBaseUri + '/SurveyService.svc/Surveys',
			data: survey
		}).then(function(data) {
			return common.makeRequest({
				method: 'GET',
				url: serviceBaseUri + 'SurveyService.svc/Surveys/' + $scope.survey.Id
			});
		}).then(function(data) {
			$scope.survey = data;
			$scope.survey.StatusText = surveyStatusArray[$scope.survey.Status];
			$scope.survey.Date = $rootScope.convertDateTime($scope.survey.DateCreated);
			if (!$scope.survey.PrototypeCodes || $scope.survey.PrototypeCodes.length == 0) {
				$scope.survey.PrototypeCodes.push({Code: '', PrototypesPerCode: ''});
			}
		});
	};
});

/******

******/
//Profile Survey Controller
appControllers.controller('profileSurveyCtrl',function($scope,$rootScope,common,$filter,$location,serviceBaseUri,localStorageService){
	$scope.resetGlobal({
		logged: true,
		headLess: false,
		footerLess: false
	});
	// Get Page Data
	$scope.monthOptions = [];

	$scope.monthOptions.push({value:1, text:'Jan'});
	$scope.monthOptions.push({value:2, text:'Feb'});
	$scope.monthOptions.push({value:3, text:'Mar'});
	$scope.monthOptions.push({value:4, text:'Apr'});
	$scope.monthOptions.push({value:5, text:'May'});
	$scope.monthOptions.push({value:6, text:'Jun'});
	$scope.monthOptions.push({value:7, text:'Jul'});
	$scope.monthOptions.push({value:8, text:'Aug'});
	$scope.monthOptions.push({value:9, text:'Sep'});
	$scope.monthOptions.push({value:10, text:'Oct'});
	$scope.monthOptions.push({value:11, text:'Nov'});
	$scope.monthOptions.push({value:12, text:'Dec'});

	$scope.dateOptions = [];
	for (var i = 1; i <= 31; i++) {
		if (i < 10) {
			$scope.dateOptions.push('0' + i);
		} else {
			$scope.dateOptions.push('' + i);
		}
	}
	$scope.yearOptions = [];
	for (var i = 1966; i <= new Date().getFullYear(); i++) {
		$scope.yearOptions.push('' + i);
	}
	$scope.todayYearOptions = [];
	for (var i = new Date().getFullYear() - 2; i <= new Date().getFullYear(); i++) {
		$scope.todayYearOptions.push('' + i);
	}
	$scope.weightOptions = [];
	for (var i = 60; i <= 300; i++) {
		$scope.weightOptions.push('' + i);
	}
	$scope.heightFeetOptions = [];
	for (var i = 4; i <= 6; i++) {
		$scope.heightFeetOptions.push('' + i);
	}
	$scope.heightInchOptions = [];
	for (var i = 0; i <= 11; i++) {
		$scope.heightInchOptions.push('' + i);
	}
	var promise = common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'ParticipantService.svc/ProfileQuestions'
	});

	function formatDate(d, type) {
		var month = d.getMonth();
		var day = d.getDate();
		var year = d.getFullYear();

    	year = year.toString();

    	month = month + 1;
    	month = month + "";

    	if (month.length == 1)
		{
			month = "0" + month;
		}

    	day = day + "";

    	if (day.length == 1)
		{
			day = "0" + day;
		}
		if(type == "m") {
			return month;
		}
		else if(type == "d") {
			return day;
		}
		else if(type == "y") {
			return year;
		}
	}

	$scope.todayMonthSelected = {selected:$scope.monthOptions[formatDate(new Date(),"m") - 1]};
	$scope.todayDateSelected = {selected:formatDate(new Date(),"d")};
	$scope.todayYearSelected = {selected:formatDate(new Date(),"y")};
	$scope.monthSelected = {};
	$scope.dateSelected = {};
	$scope.yearSelected = {};
	$scope.weightSelected = {};
	$scope.heightFeetSelected = {};
	$scope.heightInchSelected = {};
	promise.then(function(data) {
		$scope.profileQuestions = $rootScope.processRangeQuestion(data);
	});
	//Submit
	$scope.validate = function() {
		$scope.submitted = true;
		$scope.allAnswered = true;
		$scope.questionInvalid = [];
		$scope.errorCode = 0;
		angular.forEach($scope.profileQuestions, function(item, i) {
			$scope.questionInvalid[i] = false;
			console.log(item);
			if(!item.Conditional) {
				if (item.QuestionType === 0) {
					if (item.AnswerOptions[0].Type === 0) {
						if (!item.Checked) {
							$scope.allAnswered = false;
						}
					} else {
						if (!item.Input || $.trim(item.Input) === "") {
							$scope.allAnswered = false;
						}
					}
				} else if (item.QuestionType === 2) {
					var selectedItemsCount = 0;
					for(var i = 0; i < item.AnswerOptions.length; i++){
						if (item.AnswerOptions[i].Checked){
							selectedItemsCount++;
							break;
						}
					}

					$scope.allAnswered = !(selectedItemsCount === 0);
				} else {
					if (!angular.isDefined(item.Value)) {
						$scope.allAnswered = false;
					}
				}

				if (!$scope.allAnswered){
					$scope.questionInvalid[i] = true;
					return;
				}
			}
			else {
				angular.forEach($scope.profileQuestions, function(allItem, t) {
					if(item.Condition.ConditionalOnQuestionId == allItem.Id) {
						if ($scope.questionInvalid[t] == true) {
							$scope.questionInvalid[i] = true;
						}
						else if(item.Condition.ConditionalOnAnswerId == allItem.Checked && (!item.Input || $.trim(item.Input) === "")) {
							$scope.questionInvalid[i] = true;
						}
					}
				});
			}
		});
	}
	$scope.submitQuery = function(event){
		$scope.validate();
		if($scope.todayMonthSelected.selected && $scope.todayDateSelected.selected && $scope.todayYearSelected.selected && $scope.monthSelected.selected && $scope.dateSelected.selected && $scope.yearSelected.selected && $scope.weightSelected.selected && $scope.heightFeetSelected.selected && $scope.heightInchSelected.selected && $scope.allAnswered){
			var birthDate = new Date(parseInt($scope.yearSelected.selected), parseInt($scope.monthSelected.selected.value) - 1, parseInt($scope.dateSelected.selected));
			var todayDate = new Date(parseInt($scope.todayYearSelected.selected), parseInt($scope.todayMonthSelected.selected.value) - 1, parseInt($scope.todayDateSelected.selected));

			//validate Date of Birth on 2 counts cannot be in future or cannot be invalid eg Feb 30th
			if(birthDate.getTime() > new Date().getTime()){
				$scope.errorCode = 1; //Future Date of Birth
				$scope.allAnswered = false; //Trigger the validation view
				return;
			}

			if(birthDate.getDate() != $scope.dateSelected.selected ||
				birthDate.getMonth() + 1 != $scope.monthSelected.selected.value ||
				birthDate.getFullYear() != $scope.yearSelected.selected) {
				$scope.errorCode = 1;
				$scope.allAnswered = false; //Trigger the validation view
				return;
			}

			var participant = {
				TodayDate: "/Date(" + todayDate.getTime() + ")/",
				Username: $rootScope.participantUsername,
				BirthDate: "/Date(" + birthDate.getTime() + ")/",
				Weight: parseInt($scope.weightSelected.selected),
				HeightFeet: parseInt($scope.heightFeetSelected.selected),
				HeightInches: parseInt($scope.heightInchSelected.selected),
				ProfileAnswers: []
			};
			angular.forEach($scope.profileQuestions, function(item) {
				if (item.QuestionType === 0) {
					if (item.AnswerOptions[0].Type === 0) {
						if (item.Checked) {
							var answer = {
								__type: "SingleAnswer:#Tholos.Entities",
								QuestionId: item.Id,
								AnswerType: item.AnswerOptions[0].Type,
								AnswerOptionId: item.Checked
							};
							participant.ProfileAnswers.push(answer);
						}
					} else {
						if (item.Input && $.trim(item.Input) !== "") {
							var answer = {
								__type: "SingleInputAnswer:#Tholos.Entities",
								QuestionId: item.Id,
								AnswerType: item.AnswerOptions[0].Type,
								AnswerOptionId: item.AnswerOptions[0].Id,
								Input: item.Input
							};
							participant.ProfileAnswers.push(answer);
						}
					}
				};

				if (item.QuestionType === 1) {
					if (angular.isDefined(item.Value)) {
						var answer = {
							__type: "RangeAnswer:#Tholos.Entities",
							QuestionId: item.Id,
							AnswerType: item.AnswerOptions[0].Type,
							Value: item.AnswerOptions[0].FromValue < item.AnswerOptions[0].ToValue ? item.Value : item.AnswerOptions[0].FromValue - (item.Value - item.AnswerOptions[0].ToValue)
						};
						participant.ProfileAnswers.push(answer);
					}
				};

				if (item.QuestionType === 2) {
					angular.forEach(item.AnswerOptions, function(currentAnswer) {
						if (currentAnswer.Checked){
							var answer = {
								__type: "MultipleAnswer:#Tholos.Entities",
								QuestionId: currentAnswer.QuestionId,
								AnswerType: currentAnswer.Type,
								AnswerOptionId: currentAnswer.Id
							};
							participant.ProfileAnswers.push(answer);
						}
					});
				};
			});
			common.makeRequest({
				method: 'POST',
				url: serviceBaseUri + 'ParticipantService.svc/Participants',
				data: participant
			}).then(function(data) {
				$rootScope.currentParticipant = {Id: data, Weight: parseInt($scope.weightSelected.selected)};
				sessionStorage.setItem('currentParticipant', JSON.stringify($rootScope.currentParticipant));
				localStorageService.set('currentParticipant',JSON.stringify($rootScope.currentParticipant));
				$location.path('/landingParticipant');
			});
		}
	}
});

//Participant Landing Controller
appControllers.controller('landingParticipantCtrl',function($scope,$rootScope,$location,common,serviceBaseUri,localStorageService){
	$scope.resetGlobal({
		logged: true,
		headLess: false,
		footerLess: false
	});
	$scope.codeOptions = [];

	if(angular.isUndefined($rootScope.currentParticipant)) {
		$rootScope.currentParticipant = JSON.parse(localStorageService.get('currentParticipant'));
		$rootScope.participantUsername = localStorageService.get('participantUsername');
		$rootScope.participantSurvey = JSON.parse(localStorageService.get('participantSurvey'));
		$rootScope.prototypeTest = JSON.parse(localStorageService.get('prototypeTest'));
		$rootScope.prototypeCode = localStorageService.get('prototypeCode');
		console.log($rootScope.currentParticipant.Id);
	}

	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'ParticipantSurveyService.svc/Surveys/' + $rootScope.participantSurvey.SurveyId + '/PrototypeCodes'
	}).then(function(data) {
		console.log(data);
		for (var i in data) {
			$scope.codeOptions.push(data[i]);
		}
		common.makeRequest({
			method: 'GET',
			url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.currentParticipant.Id
		}).then(function(data) {
			$rootScope.participantSurvey = data;
			console.log(data);
			localStorageService.set('participantSurvey',JSON.stringify(data));
			if (data.CurrentPrototypeTestId != 0) {
				common.makeRequest({
					method: 'GET',
					url: serviceBaseUri + 'ParticipantSurveyService.svc/PrototypeTests/' + data.CurrentPrototypeTestId
				}).then(function(data) {
					$rootScope.prototypeTest = data;
					localStorageService.set('prototypeTest',JSON.stringify(data));
					$scope.prototypeCode = data.PrototypeCode;
					console.log(data);
					$rootScope.completed = data.Completed;
					$scope.prototypeCompleted = $rootScope.completed ? true : false;
				});
			} else {
				$scope.prototypeCode = $rootScope.prototypeCode ? $rootScope.prototypeCode : '';
			}
		});
	});



	$scope.allowTestProtoType = function() {
		var allow  = false;
		for(var j = 0 ; j < $scope.codeOptions.length ; j++) {
			var found = false;
			for (var i = 0; i < $rootScope.participantSurvey.PrototypeTests.length; i++) {
				console.log($scope.codeOptions[j]);
				console.log($rootScope.participantSurvey.PrototypeTests[i].PrototypeCode);
				if ($scope.codeOptions[j] == $rootScope.participantSurvey.PrototypeTests[i].PrototypeCode && $rootScope.participantSurvey.PrototypeTests[i].Completed) {
					found = true;
					break;
				}
			}
			if(found == false) {
				allow = true;
				break;
			}
		}
		console.log(allow);
		return ($rootScope.participantSurvey == null || allow);
	}

	$scope.testPrototype = function() {
		if ($rootScope.participantSurvey.CurrentPrototypeTestId == 0 && !$scope.prototypeCompleted) {
			$location.path('/testPrototype');
		}
	};
	$scope.prototypeQuestion = function() {
		if (!$scope.prototypeCompleted) {
			$location.path('/prototypeQuestion');
		}
	};
});

//Test Prototype Controller
appControllers.controller('testPrototypeCtrl',function($scope,$rootScope,$location,common,serviceBaseUri,localStorageService){
	$scope.resetGlobal({
		logged: true,
		headLess: false,
		footerLess: false
	});

	if(angular.isUndefined($rootScope.participantSurvey)) {
		$rootScope.currentParticipant = JSON.parse(localStorageService.get('currentParticipant'));
		$rootScope.participantSurvey = JSON.parse(localStorageService.get('participantSurvey'));
		$rootScope.prototypeTest = JSON.parse(localStorageService.get('prototypeTest'));
		$rootScope.participantUsername = localStorageService.get('participantUsername');
		$rootScope.prototypeCode = localStorageService.get('prototypeCode');
	}
	$scope.codeOptions = [];
	$scope.codeSelected = {};

	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'ParticipantSurveyService.svc/Surveys/' + $rootScope.participantSurvey.SurveyId + '/PrototypeCodes'
	}).then(function(data) {
		console.log(data);
		for (var i in data) {
			$scope.codeOptions.push(data[i]);
		}
	});

	// Save prototype code
	$scope.submitQuery = function(){
		$scope.submitted = true;
		$scope.codeNotFound = false;

		if($scope.codeSelected.selected){
			common.makeRequest({
				method: 'GET',
				url: serviceBaseUri + 'ParticipantSurveyService.svc/Surveys/' + $rootScope.participantSurvey.SurveyId + '/PrototypeCodes'
			}).then(function(data) {
				for (var i in data) {

					if (data[i] == $scope.codeSelected.selected) {
						$rootScope.prototypeCode = $scope.codeSelected.selected;
						localStorageService.set('prototypeCode',$scope.codeSelected.selected);
						$location.path('/landingParticipant');
						return;
					}
				}
				$scope.codeNotFound = true;
			});
		}
	}
});

//Prototype Questions Controller
appControllers.controller('prototypeQuestionCtrl',function($scope,$rootScope,$location,common,serviceBaseUri,localStorageService){
	$scope.resetGlobal({
		logged: true,
		headLess: false,
		footerLess: false
	});

	//Validation
	$scope.isValid = function(item){
		if (item.QuestionType === 0 || item.QuestionType === 1){
			return !(item.Checked || (item.Input && item.Input.trim() != '') || item.Value);
		}

		if (item.QuestionType === 2) {
			var selectedItemsCount = 0;
			for(var i = 0; i < item.AnswerOptions.length; i++){
				if (item.AnswerOptions[i].Checked){
					selectedItemsCount++;
					break;
				}
			}

			return (selectedItemsCount === 0);
		}
	}

	$scope.back = function() {
		if($scope.step == 0) {
			$location.path('/landingParticipant');
		}
		else {
			$scope.step--;
		}
	}

	if(angular.isUndefined($rootScope.participantSurvey)) {
		$rootScope.currentParticipant = JSON.parse(localStorageService.get('currentParticipant'));
		$rootScope.participantSurvey = JSON.parse(localStorageService.get('participantSurvey'));
		$rootScope.prototypeTest = JSON.parse(localStorageService.get('prototypeTest'));
		$rootScope.participantUsername = localStorageService.get('participantUsername');
		$rootScope.prototypeCode = localStorageService.get('prototypeCode');
	}

	//Next
	$scope.step = -1;
	if ($rootScope.participantSurvey.CurrentPrototypeTestId != 0) {
		common.makeRequest({
			method: 'GET',
			url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.participantSurvey.Id + '/PrototypeQuestions'
		}).then(function(data) {
			console.log(data);
			$scope.questions = $rootScope.processRangeQuestion(data);

			angular.forEach($scope.questions, function(item) {
				for (var i in $rootScope.prototypeTest.Answers) {
					if ($rootScope.prototypeTest.Answers[i].QuestionId == item.Id) {
						item.AnswerId = $rootScope.prototypeTest.Answers[i].Id;
						if (item.QuestionType === 0) {
							if (item.AnswerOptions[0].Type === 0) {
								item.Checked = $rootScope.prototypeTest.Answers[i].AnswerOptionId;
							} else {
								item.Input = $rootScope.prototypeTest.Answers[i].Input;
							}
						} else {
							item.Value = item.AnswerOptions[0].FromValue < item.AnswerOptions[0].ToValue ? $rootScope.prototypeTest.Answers[i].Value : item.AnswerOptions[0].ToValue + (item.AnswerOptions[0].FromValue - $rootScope.prototypeTest.Answers[i].Value);
						}
						break;
					}
				}
			});
			$scope.step = 0;
		});
	}
	// Upload photo
	$scope.upload = function(flow) {
		flow.opts.target = serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/UploadPhoto?fileName=' + flow.files[0].name;
		flow.opts.headers = {"Authorization": "Basic " + $rootScope.authHeader};
		flow.opts.uploadMethod = "POST";
		flow.opts.method = 'octet';
		flow.opts.testChunks = false;
		flow.upload();
	};
	// Callback when upload is successful.
	$scope.uploadSuccess = function(file, message) {
		var prototypeTest = {
			PrototypeCode: $rootScope.prototypeCode,
			ParticipantSurveyId: $rootScope.participantSurvey.Id,
			Iteration: 1,
			BeforeWeight: $rootScope.currentParticipant.Weight
		};
		console.log(prototypeTest);
		common.makeRequest({
			method: 'POST',
			url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.participantSurvey.Id + '/PrototypeTests?beforePhotoName=' + message.substring(1, message.length - 1),
			data: prototypeTest
		}).then(function(data) {
			$rootScope.prototypeTest = prototypeTest;
			$rootScope.prototypeTest.Id = data;
			return common.makeRequest({
				method: 'GET',
				url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.participantSurvey.Id + '/PrototypeQuestions'
			});
		}).then(function(data) {
			console.log(data);
			$scope.questions = $rootScope.processRangeQuestion(data);
			$scope.step = 0;
		});
	};
	// Go to next question.
	$scope.next = function(event){
		console.log($scope.questions);

		if(!$(event.target || event.srcElement).hasClass('disabled')){
			$scope.submitAnswer('PrototypeAnswers', $scope.questions[$scope.step], function(data) {
				var nextIndex = $scope.step + 1;
				var question = $scope.questions[nextIndex];
				console.log(nextIndex);
				if (question.Conditional) {

					var conditionMeet = false;
					var found = false;

					for (var i = 0; i < nextIndex; i++) {
						var item = $scope.questions[i];
						//alert(item.Id);
						//alert(question.Condition.ConditionalOnQuestionId);
						if (item.Id == question.Condition.ConditionalOnQuestionId) {
							found = true;
							//alert(item.Checked + " --- "+ question.Condition.ConditionalOnAnswerId);
							if (item.Checked == question.Condition.ConditionalOnAnswerId) {
								conditionMeet = true;
								break;
							}
						}
					}

					if (!conditionMeet) {
						$scope.step = nextIndex + 1;
						$('.progress').width((100.0 / ($scope.questions.length + 1) * ($scope.step + 1)) + "%");
						return;
					}
					$scope.step = nextIndex;
					$('.progress').width((100.0 / ($scope.questions.length + 1) * ($scope.step + 1)) + "%");
					return;

				} else {
					$scope.step++;
					$('.progress').width((100.0 / ($scope.questions.length + 1) * ($scope.step + 1)) + "%");
				}
			});
		}
	};
	// Complete prototype questions.
	$scope.save = function(event){
		if(!$(event.target || event.srcElement).hasClass('disabled')){
			$scope.submitAnswer('PrototypeAnswers', $scope.questions[$scope.step], function(data) {
				common.makeRequest({
					method: 'PUT',
					url: serviceBaseUri + 'ParticipantSurveyService.svc/PrototypeTests/' + $rootScope.prototypeTest.Id + '/Complete?fileName=&afterWeight='
				}).then(function() {
					$rootScope.completed = true;
					$location.path('/landingParticipant');
				});
			});	
		}	
	};
});

//Post Testing Question Controller
appControllers.controller('postTestingQuestionCtrl',function($scope,$rootScope,$location,common,serviceBaseUri,localStorageService){
	$scope.resetGlobal({
		logged: true,
		headLess: false,
		footerLess: false
	});

	$scope.back = function() {
		if($scope.step == 0) {
			$location.path('/landingParticipant');
		}
		else {
			$scope.step--;
		}
	}

	if(angular.isUndefined($rootScope.participantSurvey)) {
		$rootScope.currentParticipant = JSON.parse(localStorageService.get('currentParticipant'));
		$rootScope.participantSurvey = JSON.parse(localStorageService.get('participantSurvey'));
		$rootScope.prototypeTest = JSON.parse(localStorageService.get('prototypeTest'));
		$rootScope.participantUsername = localStorageService.get('participantUsername');
		$rootScope.prototypeCode = localStorageService.get('prototypeCode');
	}

	$scope.step = -1;
	common.makeRequest({
		method: 'GET',
		url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.participantSurvey.Id + '/PostTestingQuestions'
	}).then(function(data) {
		console.log(data);
		$scope.questions = $rootScope.processRangeQuestion(data);
		$scope.step = 0;
	});
	// Go to next question.
	$scope.next = function(event){
		if(!$(event.target || event.srcElement).hasClass('disabled')){
			$scope.submitAnswer('PostTestingAnswers', $scope.questions[$scope.step], function(data) {
				var nextIndex = $scope.step + 1;
				var question = $scope.questions[nextIndex];
				if (question.Conditional) {
					var conditionMeet = false;
					var found = false;
					for (var i = 0; i < nextIndex - 1; i++) {
						var item = $scope.questions[i];
						if (item.Id == question.Condition.ConditionalOnQuestionId) {
							found = true;
							if (item.Checked == question.Condition.ConditionalOnAnswerId) {
								conditionMeet = true;
								break;
							}
						}
					}
					if (!found) {
						$scope.step = nextIndex;
						$('.progress').width((100.0 / ($scope.questions.length + 1) * ($scope.step + 1)) + "%");
						return;
					}
					if (!conditionMeet) {
						$scope.step = nextIndex + 1;
						$('.progress').width((100.0 / ($scope.questions.length + 1) * ($scope.step + 1)) + "%");
						return;
					}
				} else {
					$scope.step++;
					$('.progress').width((100.0 / ($scope.questions.length + 1) * ($scope.step + 1)) + "%");
				}
			});
		}
	};
	// Complete post testing questions.
	$scope.submit = function(event){
		if(!$(event.target || event.srcElement).hasClass('disabled')){
			$scope.submitAnswer('PostTestingAnswers', $scope.questions[$scope.step], function(data) {
				common.makeRequest({
					method: 'PUT',
					url: serviceBaseUri + 'ParticipantSurveyService.svc/ParticipantSurveys/' + $rootScope.participantSurvey.Id + '/Complete'
				}).then(function() {
					$location.path('/thankYou');
				});
			});	
		}	
	};
});

//Thank You Controller
appControllers.controller('thankYouCtrl',function($scope,$location){
	$scope.resetGlobal({
		logged: false,
		headLess: false,
		footerLess: false
	});
});

//Closed Survey Controller
appControllers.controller('closedsurveyCtrl',function($scope,$location){
	$scope.resetGlobal({
		logged: false,
		headLess: false,
		footerLess: false
	});
});