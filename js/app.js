var gui = require('nw.gui'),
    fs = require('fs');
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
          that.controllerFor('index').send('updateEditor', data.toString());
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
  },
  keyUp: function() {
    this.get('controller').send('renderMarkdown', this.editor.getValue());
  }
});

App.IndexController = Ember.ObjectController.extend({
  actions: {
    renderMarkdown: function(value) {
      var markdown = marked(value);
      this.set('body', markdown);
      $('#markdown-preview').html(markdown);
    },

    updateEditor: function(value) {
      ace.edit("editor").setValue(value);
      this.send('renderMarkdown', value);
    }
  }
});
