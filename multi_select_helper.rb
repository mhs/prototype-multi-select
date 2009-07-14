module MultiSelectHelper
  module Presenter
    def serialize?
      !children?
    end

    def children?
      respond_to?(:children)
    end

    def parent?
      respond_to?(:parent)
    end
    
    def hierarchy_ids
      if parent?
        parent.hierarchy_ids + [id]
      else
        [id]
      end
    end
  end

  def multi_select(name, unselected = [], selected = [])
    html = Builder::XmlMarkup.new
    html.div :class => "multi_select clearfix", :"data-name" => "#{name}[]" do
      html.div :class => "unselected" do
        html.div :class => "header" do
          html.input :type => "text", :placeholder => "Search..."
        end

        build_items(unselected, html)

        html.div :class => "footer clearfix" do
          html << rounded_button_function("Select All", nil, :class => "small select_all", :icon => "select_all")
        end
      end
      
      html.div :class => "selected" do
        html.div :class => "header" do
          html.input :type => "text", :placeholder => "Search..."
        end

        html.ul :"data-selected" => selected.map(&:hierarchy_ids).to_json do
        end

        html.div :class => "footer clearfix" do
          html << rounded_button_function("Unselect All", nil, :class => "small unselect_all", :icon => "unselect_all")
        end
      end
    end
  end

  def build_items(items, html)
    html.ul do
      items.each do |item|
        html.li :"data-id" => item.id, :"data-serialize" => item.serialize? do
          html.div item.name, :class => "name"
          build_items(item.children, html) if item.children?
        end
      end
    end
  end
end