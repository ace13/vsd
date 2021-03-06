/* global $ */
var view = require('./view.html')
var Model = require('./model')
var patch = require('../patch')
var keyView = require('./key.html')
var keysView = require('./keys.html')
var modelView = require('./model.html')
var schemaView = require('./schema.html')
var Controller = require('./controller')
var graph = require('./graph')

var Db = document.registerElement('vsd-db', {
  prototype: Object.create(window.HTMLElement.prototype, {
    attachedCallback: {
      value: function () {
        var el = this
        // Attach the tab change handler after a
        // short delay to ensure the svg is loaded
        setTimeout(function () {
          $('a.graph', el).on('shown.bs.tab', function (e) {
            graph(document.querySelector('svg#model-graph'), el.ctrl)
          })
        }, 100)
      }
    },
    render: {
      value: function () {
        var ctrl = this.ctrl
        patch(this, function () {
          view(ctrl, modelView, schemaView, keysView, keyView)
        })
      }
    },
    data: {
      get: function () {
        return this._data
      },
      set: function (value) {
        this._data = value
        var data = value ? JSON.parse(value) : new Model()
        var ctrl = new Controller({
          el: this,
          model: data
        })
        ctrl.currentItem = ctrl.model

        // Render on changes to the controller
        ctrl.on('change', function (e) {
          this.render()
        }.bind(this))

        // Emit data changes when the model changes
        ctrl.model.on('change', function (e) {
          var event = new window.CustomEvent('data', {
            detail: {
              originalEvent: e,
              data: JSON.stringify(ctrl.model, null, 2)
            }
          })
          this.dispatchEvent(event)
        }.bind(this))

        this.ctrl = ctrl
        this.render()
      }
    }
  })
})

module.exports = Db
