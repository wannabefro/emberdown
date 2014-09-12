var gui = require('nw.gui'),
fs = require('fs'),
marked = require('marked');
App = Ember.Application.create();

App.Router.map(function() {
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
    openFile: function() {
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

    saveFile: function() {
      var chooser = $('#fileSave');
      var path;
      if (!this.get('index.content.path')) {
        chooser.trigger('click');
        chooser.change(function(e) {
          path = $(this).val();
        });
      };
      this.get('index').send('writeFile', path);
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
      label: 'Open',
      click: function() {
        that.get('controller').send('openFile');
      }
    }));

    file.insert(new gui.MenuItem({
      label: 'Save',
      click: function() {
        that.get('controller').send('saveFile');
      }
    }));
    win.menu = menubar;
    win.menu.insert(new gui.MenuItem({ label: 'File', submenu: file}), 1);
}
});

App.IndexView = Ember.View.extend({
  editor: null,
  didInsertElement: function() {
    this.editor = ace.edit("editor");
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
