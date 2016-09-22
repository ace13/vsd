var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch

IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value === null || typeof (value) === 'undefined' ? '' : value
}

IncrementalDOM.attributes.checked = function (el, name, value) {
  el.checked = !!value
}

module.exports = function (el, view, data) {
  var args = Array.prototype.slice.call(arguments)
  if (args.length <= 3) {
    patch(el, view, data)
  } else {
    patch(el, function () {
      view.apply(this, args.slice(2))
    })
  }
}
