(function () {
  var settings = {
    bounds: '#third-example',
    possibleToReplaceItem: true,
    dragItems: [
      {
        node: '#drag-item-3-1',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-3-2',
        data: null,
        ariaLabel: '',
        className: 'drag-item',
      },
      {
        node: '#drag-item-3-3',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-3-4',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-3-5',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      }
    ],
    onCreate: function (dndObj) {
      console.log(dndObj);
    }
  };

  var dnd = new CgDnd(settings);
})();