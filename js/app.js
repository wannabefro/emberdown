var gui = require('nw.gui'),
fs = require('fs'),
marked = require('marked'),
attr = DS.attr;
App = Ember.Application.create();

App.ApplicationSerializer = DS.LSSerializer.extend();

App.ApplicationAdapter = DS.LSAdapter.extend({
    namespace: 'emberdown'
});

App.Setting = DS.Model.extend({
  fontSize: attr('string', {defaultValue: '12'})
});

App.initializer({
  name: 'settings',

  initialize: function(container, application) {
    application.deferReadiness();
    var store = container.lookup('store:main');
    store.findAll('setting').then(function(response){
      if (response.content.length === 0) {
        var settings = store.createRecord('setting');
        setting.save();
      } else {
      var settings = response.get('firstObject');
      };
      application.register('settings:current', settings, {instantiate: false});
      application.inject('route', 'currentSettings', 'settings:current');
      application.inject('controller', 'currentSettings', 'settings:current');
      application.advanceReadiness();
    });
  }
});

App.Router.map(function() {
  this.route('settings');
});

App.SettingsRoute = Ember.Route.extend({
  model: function() {
    return this.get('currentSettings');
  },
  actions: {
    updateSettings: function() {
      var that = this;
      this.currentModel.save().then(function(success) {
        that.transitionTo('index');
      }, function(err){
        alert('something went wrong :(');
      });
    }
  }
});

App.ApplicationRoute = Ember.Route.extend({
  actions: {
    settings: function() {
      this.transitionTo('settings');
    }
  }
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return {
      body: "",
      path: null
    }
  }
});

App.ApplicationController = Ember.Controller.extend({
  needs: ['index'],
  index: Ember.computed.alias("controllers.index"),

  actions: {
    open: function() {
      var that = this;
      var chooser = $('#fileDialog');
      chooser.change(function(e) {
        var path = $(this).val();
        if (path === '')
          return;
        that.get('index').send('openFile', path);
        $(this).val('');
      });
      chooser.trigger('click');
    },

    saveAs: function() {
      this.set('index.content.path', null);
      this.send('save');
    },

    save: function() {
      var path;
      var pathChanged = new $.Deferred();
      var that = this;
      var chooser = $('#fileSave');
      chooser.change(function(e) {
        path = $(this).val();
        pathChanged.resolve();

      });
      if (!that.get('index.content.path')) {
        chooser.trigger('click');
      } else {
        pathChanged.resolve();
      };
      $.when(pathChanged).done(function() {
        that.get('index').send('writeFile', path);
      });
    }

  }
});

App.ApplicationView = Ember.View.extend({
  didInsertElement: function() {
    var that = this;
    var win = gui.Window.get();
    var menubar = new gui.Menu({ type: 'menubar' });
    menubar.createMacBuiltin('Emberdown');

    var file = new gui.Menu();

    file.insert(new gui.MenuItem({
      label: 'Settings',
      click: function() {
        that.get('controller').send('settings');
      }
    }));

    file.insert(new gui.MenuItem({
      label: 'Save As',
      click: function() {
        that.get('controller').send('saveAs');
      }
    }));

    file.insert(new gui.MenuItem({
      label: 'Save',
      click: function() {
        that.get('controller').send('save');
      },
      key: 's',
      modifiers: 'cmd'
    }));

    file.insert(new gui.MenuItem({
      label: 'Open',
      click: function() {
        that.get('controller').send('open');
      },
      key: 'o',
      modifiers: 'cmd'
    }));
    win.menu = menubar;
    win.menu.insert(new gui.MenuItem({ label: 'File', submenu: file}), 1);
}
});

App.IndexView = Ember.View.extend({
  editor: null,
  didInsertElement: function() {
    var currentSettings = this.get('controller.currentSettings');
    this.editor = ace.edit("editor");
    this.editor.setFontSize(currentSettings.get('fontSize') + 'px');
    this.controller.set('editor', this.editor);
    this.editor.getSession().setMode("ace/mode/markdown");
    $('.ace_text-input').focus();

    marked.setOptions({
      gfm: true,
      breaks: true,
      highlight: function (code) {
        return require('highlight.js').highlightAuto(code).value;
      }
    });
  },

  keyUp: function() {
    this.get('controller').set('body', this.editor.getValue());
  }
});

App.IndexController = Ember.ObjectController.extend({
  editor: null,

  renderedMarkdown: function() {
    var markdown = marked(this.get('body'));
    return markdown;
  }.property('body'),

  actions: {
    updateEditor: function() {
      ace.edit("editor").setValue(this.get('body'));
    },

    openFile: function(path) {
      var that = this;
      fs.readFile(path, function(err, data) {
        if (err)
          alert('Sorry something went wrong :(');
        that.set('body', data.toString());
        that.set('path', path);
        that.send('updateEditor');
        that.editor.clearSelection();
      });
    },

    writeFile: function(path) {
      var that = this;
      var path = path || this.get('path');
      fs.writeFile(path, this.get('body'), function(err){
        if (err) {
          alert('Something went wrong. Sorry :(');
        } else {
          that.set('path', path);
        }
      });
    }
  }
});
