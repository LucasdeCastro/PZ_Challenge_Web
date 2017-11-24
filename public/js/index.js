(function() {
  let currentItem;
  const self = this;
  const baseUrl = "//localhost:8080/api/albums";
  const player = new Player({
    playerContent: "player",
    canvasPlayer: false,
    onRewind: onRewind,
    onForward: onForward,
    onClose: onClose
  });

  function onRewind() {
    if (self.objects.length > 0) {
      const aux = currentItem - 1;
      setVideo(self.objects[aux], aux);
    }
  }

  function onForward() {
    if (currentItem < self.objects.length) {
      const aux = currentItem + 1;
      setVideo(self.objects[aux], aux);
    }
  }

  function onClose() {
    $("#player").hide();
    player.pause();
  }

  function loadData() {
    $.getJSON(baseUrl).then(function(data) {
      self.assetsUrl = data.assetsLocation;
      self.objects = data.objects;
      createList(data.objects);
    });
  }

  function createURL(route) {
    return self.assetsUrl + "/" + route;
  }

  function createList(list) {
    list.forEach(createItem("#content"));
  }

  function setVideo(item, key) {
    currentItem = key;
    $("#player").show();

    player.play({
      title: item.name,
      video: createURL(item.bg),
      audio: createURL(item.sg),
      subtitles: item.txts || []
    });
  }

  function createItem(id) {
    const div = $(id);
    return function(item, key) {
      const img = $("<img>")
        .attr("class", "card-img")
        .attr("src", createURL(item.im));

      const text = $("<div>")
        .attr("class", "card-text")
        .append(item.name);

      const card = $("<div>")
        .attr("class", "card")
        .append(img)
        .append(text);

      card.click(function() {
        setVideo(item, key);
      });

      div.append(card);
    };
  }

  $(document).ready(function() {
    loadData();
  });
})();
