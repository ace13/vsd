var filesystem = require('../../file-system');
var watcher = require('../../file-system-watcher');
var utils = require('../../../../shared/utils');
var EditSession = ace.require('ace/edit_session').EditSession;
var UndoManager = ace.require('ace/undomanager').UndoManager;

module.exports = function($stateProvider) {

  $stateProvider
    .state('app.fs', {
      abstract: true
    })
    .state('app.fs.finder', {
      url: '/finder',
      views: {
        '@app': { // Target the ui-view='' in parent state 'app'
          controller: 'FsFinderCtrl',
          templateUrl: '/client/fs/views/finder.html'
        }
      }
    })
    .state('app.fs.finder.file', {
      url: '/file/:path',
      controller: 'FsFileCtrl',
      templateUrl: '/client/fs/views/file.html',
      resolve: {
        session: ['$q', '$stateParams', 'FileService', 'SessionService', 'uiAceConfig',
          function($q, $stateParams, fileService, sessionService, aceConfig) {
            var deferred = $q.defer();
            var path = utils.decodeString($stateParams.path);

            console.log('Requested file ' + path);

            var session = sessionService.findSession(path);

            if (session) {

              console.log('Using found session.');
              deferred.resolve(session);

            } else {

              console.log('Reading file for new session.');
              fileService.readFile(path).then(function(file) {

                var isUtf8 = !(file.contents instanceof ArrayBuffer);

                var sessionData;
                if (isUtf8) {
                  sessionData = new EditSession(file.contents, modes[file.ext]);
                  sessionData.setTabSize(aceConfig.ace.tabSize);
                  sessionData.setUseSoftTabs(aceConfig.ace.useSoftTabs);
                  sessionData.setUndoManager(new UndoManager());
                } else {
                  sessionData = file.contents;
                }

                session = sessionService.addSession(path, sessionData, isUtf8);

                deferred.resolve(session);

              });
            }
            return deferred.promise;
          }
        ]
      }
    })
    .state('app.fs.search', {
      url: '/search?q',
      views: {
        '@app': { // Target the ui-view='' in parent state 'app',
          controller: 'FsSearchCtrl',
          templateUrl: '/client/fs/views/search.html'
        }
      }
    })
    .state('app.fs.dir', {
      url: '/dir/:path',
      views: {
        '@app': { // Target the ui-view='' in parent state 'app',
          controller: 'FsDirCtrl',
          templateUrl: '/client/fs/views/dir.html',
          resolve: {
            dir: ['$stateParams',
              function($stateParams) {
                var path = utils.decodeString($stateParams.path);
                return watcher.map[path];
              }
            ]
          }
        }
      }
    });

};