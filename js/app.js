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
    }
  }
});
