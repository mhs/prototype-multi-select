// TODO: mocking (events, highlight)
// TODO: test nested items (filtering, moving)
// TODO: Fix specs in safari (_multi_select is not set)
var MultiSelect = Class.create({
  initialize: function(element) {
    this.element = element;
    this.element._multi_select = this;
    
    this.field_name = this.element.getAttribute("data-name");
    
    this.select_all_button = element.down(".select_all");
    this.select_all_button.observe("click", this.selectAll.bind(this));

    this.unselect_all_button = element.down(".unselect_all");
    this.unselect_all_button.observe("click", this.unselectAll.bind(this));

    this.unselected_search_field = element.down(".unselected .header input");
    this.unselected_search_field.observe("keyup", this.filterUnselectedItems.bind(this));

    this.selected_search_field  = element.down(".selected .header input");
    this.selected_search_field.observe("keyup", this.filterSelectedItems.bind(this));

    this.unselected_list = element.down(".unselected ul");
    this.unselected_list.observe("click", function(event) {
      if(event.element().match(".name")) {
        this.selectItem(event.element().up("li"));
      }
    }.bind(this));

    this.selected_list = element.down(".selected ul");
    this.selected_list.observe("click", function(event) {
      if(event.element().match(".name")) {
        this.unselectItem(event.element().up("li"));
      }
    }.bind(this));
    
    this.selectItems(this.selected_list.getAttribute("data-selected").evalJSON());
    
    this._updateHiddenInputs();
    
    this.initialized = true;
  },

  filterUnselectedItems: function() {
    this.filterItems(this.unselected_list, this.unselected_search_field.realValue());
  },
  
  filterSelectedItems: function() {
    this.filterItems(this.selected_list, this.selected_search_field.realValue());
  },
  
  filterItems: function(listToFilter, term) {
    listToFilter.childElements().each(function(childElement) {
      if(childElement.down("ul")) {
        this.filterItems(childElement.down("ul"), term);
      }

      if(term.blank()) {
        childElement.show();
        childElement.removeClassName("result");
      } else if(childElement.down(".name").innerHTML.unescapeHTML().toLowerCase().match(term.toLowerCase())) {
        childElement.show();
        childElement.addClassName("result");
      } else if(childElement.down(".result")) {
        childElement.show();
        childElement.removeClassName("result");
      } else {
        childElement.hide();
        childElement.removeClassName("result");
      }
    }.bind(this));
  },
  
  clearUnselectedFilter: function() {
    this.clearFilter(this.unselected_list, this.unselected_search_field);
  },
  
  clearSelectedFilter: function() {
    this.clearFilter(this.selected_list, this.selected_search_field);
  },
  
  clearFilter: function(listToFilter, searchField) {
    searchField.showPlaceholder();
    this.filterItems(listToFilter, "");
  },
  
  selectAll: function() {
    this.moveAll(this.unselected_list, this.selected_list, this.unselected_search_field.blank() ? "li" : "li.result");
  },

  unselectAll: function() {
    this.moveAll(this.selected_list, this.unselected_list, this.selected_search_field.blank() ? "li" : "li.result");
  },
  
  moveAll: function(sourceList, destinationList, selector) {
    sourceList.select(selector).reverse().each(function(item) {
      this.moveItem(item, sourceList, destinationList);
    }.bind(this));
    
    this.clearUnselectedFilter();
    this.clearSelectedFilter();
  },

  selectItems: function(items_ids){
    items_ids.each(function(item_ids) {
      var container = this.unselected_list;
      var item;
      item_ids.each(function(item_id) {
        item = container.childElements().find(function(e) { return e.getAttribute("data-id") == item_id; });
        container = item.down("ul");
      }.bind(this));
      
      this.moveItem(item, this.unselected_list, this.selected_list);
    }.bind(this));
  },
  
  selectItem: function(item) {
    this.moveItem(item, this.unselected_list, this.selected_list);
    this.filterUnselectedItems();
    this.clearSelectedFilter();
  },
  
  unselectItem: function(item) {
    this.moveItem(item, this.selected_list, this.unselected_list);
    this.filterSelectedItems();
    this.clearUnselectedFilter();
  },
  
  moveItem: function(item, sourceList, destinationList) {
    var container;
    
    var leaves;
    if(item.down("li")) {
      leaves = item.select("li").select(function(element) {
        return !element.down("li");
      }.bind(this));
    } else {
      leaves = [item];
    }
    
    leaves.each(function(leaf, index) {
      container = destinationList;
    
      var parents = leaf.ancestors().select(function(element) {
        return element.match("li") && element.descendantOf(sourceList);
      }.bind(this));
      
      parents.reverse().each(function(parent) {
        // var element = container.down("/li[data-id=" + parent.getAttribute("data-id") + "]");
        var element = container.childElements().find(function(e) { return e.getAttribute("data-id") == parent.getAttribute("data-id"); });
        if(element) {
          container = element.down("ul");
        } else {
          clone = parent.cloneNode(false);
          clone.insert(parent.down(".name").cloneNode(true));
          clone.insert("<ul></ul>");
          
          container.insertInOrder(clone, ".name");
          if(this.initialized){
            this.highlightItem(clone);
          }
          container = clone.down("ul");
        }
      }.bind(this));
      
      // var elementInDestinationList = container.down("/li[data-id=" + leaf.getAttribute("data-id") + "]");
      var elementInDestinationList = container.childElements().find(function(e) { return e.getAttribute("data-id") == leaf.getAttribute("data-id"); });
      if(elementInDestinationList) {
        if(leaf.up()) { leaf.remove(); }
      } else {
        container.insertInOrder(leaf, ".name");
        if(this.initialized){
          if(index == leaves.length - 1) { new Effect.ScrollToInDiv(destinationList, leaf, { duration: 0.3 }); }
          this.highlightItem(leaf);
        }
      }
    }.bind(this));
    
    this._cleanItems(sourceList, destinationList);
    this._updateHiddenInputs();
  },
  
  _cleanItems: function(listToClean, listToCheck) {
    listToClean.childElements().each(function(childElement) {
      // var element = listToClean.down(">li[data-id=" + childElement.getAttribute("data-id") + "]")
      var element = listToCheck.childElements().find(function(e) { return e.getAttribute("data-id") == childElement.getAttribute("data-id"); });
      if(element) {
        if(childElement.down("ul")) {
          this._cleanItems(childElement.down("ul"), element.down("ul"));
        }
        if(!childElement.down("ul") || childElement.down("ul").childElements().length == 0) {
          childElement.remove();
        }
      }
    }.bind(this));
  },
  
  _updateHiddenInputs: function() {
    this.element.select(".selected input[type=hidden]").invoke("remove");

    var input = new Template("<input type='hidden' name='#{name}' value='#{value}' />");
    if(this.selected_list.select("li[data-serialize=true]").any()) {
      this.selected_list.select("li[data-serialize=true]").each(function(item) {
        this.element.down(".selected").insert(
          input.evaluate({name: this.field_name, value: item.getAttribute("data-id")})
        );
      }.bind(this));
    } else {
      this.element.down(".selected").insert(
        input.evaluate({name: this.field_name, value: null})
      );
    }
  },
  
  highlightItem: function(item) {
    item.down(".name").highlight({duration: 1, keepBackgroundImage: true, afterFinish: function() { item.down(".name").setStyle({backgroundColor: null}); }});
  }
});

document.observe('dom:loaded', function(){
  $$(".multi_select").each(function(element) {
    new MultiSelect(element);
  })
});
