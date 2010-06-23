/*
   ajaxifyNestedAttributes
*/
/*
   TODO make more abstract. ajaxifyNestedAttribute
   * provide options for:
   ** new_object link selector
   ** nested Model name
   ** json format
   ** HTML output
   * examine parent form for Model, id, post/put/update
*/
(function($){
  var _plugin = 'ajaxify_nested_attributes';
  var _options = _plugin + ':options';
  var defaults = {model_key : 'id', model_val : 'name', after : 'h1'};
  
  var pluginMethods = {
    _new : function(obj) {
      options = obj.data(_options)
      if (options['cache']) {
        pluginMethods._add_new(obj, options['cache']);
      } else {
        $.get(options['url'], {}, function(data) {
          pluginMethods._setOptions(obj, {cache : data});
          pluginMethods._add_new(obj, data);
        },
        'json');
      }
    },
    _delete : function(link,el) {
      // hide li
      var li = $(link).parent();
      li.slideUp();
      
      // set _delete true
      if (li.find('input.destroy').length == 1){
        li.find('input.destroy').val(1)
      } else {
        li.remove();
        if (el.find('h2.new + ul li').length == 0) {
          el.find('h2.new + ul').remove();
          el.find('h2.new').slideUp().remove();
        }
      }
    },
    _add_new : function(obj, data) {
      var _el = obj;
      var options = _el.data(_options);
      var _model_key = options['model_key'];
      var _model_val = options['model_val'];
      var _nested_model = options['nested_model'];
      var _custom_label = options['custom'];
      var items = [];
      var new_id = new Date().getTime();
      var fields_for = _nested_model+"["+new_id+"]";
      
      // set up section to append values to
      if (_el.find('h2.new').length == 0){
        h2 = $("<h2 class='new'>new</h2>").hide();
        _el.find(options['after']).eq(0).after(h2);
        h2.slideDown(100);
        ul = $('<ul></ul>');
        h2.after(ul);
      } else {
        ul = _el.find('.new + ul');
      }
      
      // set up select object
      for (i=0;i<data.length;i++){
        items.push("<option value='"+data[i][_model_key]+"'>"+data[i][_model_val]+"</option>");
      }
      if (typeof(_custom_label)!='undefined') items.push("<option value='' class='custom'>"+_custom_label+"</option>");
      
      // add to DOM
      li = $('<li id="'+new_id+'"></li>').appendTo(ul).hide().slideDown(100);
      $("<a href='' class='delete'>-</a><span><select name='"+fields_for+"["+options['model']+"_id]'>"+items.join('')+"</select> <input type='text' name='"+fields_for+"[level]' /></span>").appendTo(li).hide().fadeIn();
      
      // if selected options is the one for custom attributes, watch it
      if (typeof(options['custom'])!='undefined') pluginMethods._watch_custom_option('#'+new_id, fields_for+"["+_model_val+"]")
    },
    _watch_custom_option : function(id, field_name){
      var _el = $(id + ' select:first-child');
      $(_el).bind('change', function(){
        if (_el.find(':selected').hasClass('custom')){
          $('<input type="text" name="'+field_name+'" class="custom_text"/>').appendTo(_el.parent()).hide().fadeIn();
        } else {
          _el.parent().find('.custom_text').slideUp().remove();
        };
      });
    },
    _setOptions : function(el, options) {
      options = $.extend({}, defaults, el.data(_options), options);
      el.data(_options, options);
      return options;
    }
  };
  
  $.fn.ajaxifyNestedAttributes = function(options) {
    var el = $(this)
    var _model = el.attr('data-model');
    var _nested_model = el.attr('data-nested-model').replace(/\[([^\]]+)\]/g, "[$1_attributes]");

    options = $.extend({model : _model, nested_model : _nested_model}, options)
    // TODO throw if no _model or _nested_model, options.url, options.after, etc.
    pluginMethods._setOptions(el, options);
    
    $("#new_"+_model).click(function(e){
      e.preventDefault();
      pluginMethods._new(el);
    });
    
    el.find('.delete').live('click', function(e){
      e.preventDefault();
      pluginMethods._delete(this,el);
    })

    return this;
  };
  
  jQuery.ajaxifyNestedAttributes = function(options){
    var util = {
      _new : function(el){
        
      },
      _delete : function(el){
        
      }
    }
  }
  
  jQuery.fn.addsNestedAttribute = function(method, options){
    if (options==undefined){
      options = method;
      method = 'show';
    }
    var el = jQuery(this);
    var url = el.attr('href');
    
    el.live('click', function(e){
      e.preventDefault();
      jQuery.ajaxifyNestedAttributes.util._new(this);
    });
    
    return this;
  };
  
  jQuery.fn.deletesNestedAttribute = function(target, method, options){
    if (target==undefined){
      throw("no target selector for deletesNestedAttribute");
    };
    if (options==undefined){
      options = method;
      method = 'hide';
    };
    var el = jQuery(this);
    
    el.live('click', function(e){
      e.preventDefault();
      jQuery.ajaxifyNestedAttributes.util._delete(this);
    });
    
    return this;
  };
})(jQuery);
