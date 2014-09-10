var gui = require('nw.gui'),
    fs = require('fs'),
    marked = require('marked');
App = Ember.Application.create();

App.Router.map(function() {
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return {
      body: ""
    }
  }
});

App.ApplicationController = Ember.Controller.extend({
  actions: {
    openFile: function() {
      var that = this;
      var chooser = $('#fileDialog');
      chooser.change(function(e) {
        fs.readFile($(this).val(), function(err, data) {
          if (err)
            alert('Sorry something went wrong');
          that.controllerFor('index').set('body', data.toString());
          that.controllerFor('index').send('updateEditor');
        });
      });
      chooser.trigger('click');
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
    win.menu = menubar;
    win.menu.insert(new gui.MenuItem({ label: 'File', submenu: file}), 1);
}
});

App.IndexView = Ember.View.extend({
  editor: null,
  didInsertElement: function() {
    this.editor = ace.edit("editor");
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
  renderedMarkdown: function() {
    var markdown = marked(this.get('body'));
    return markdown;
  }.property('body'),

  actions: {
    updateEditor: function() {
      ace.edit("editor").setValue(this.get('body'));
    }
  }
});
