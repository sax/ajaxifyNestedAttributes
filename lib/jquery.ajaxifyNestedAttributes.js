/*
   ajaxifyNestedAttributes
*/
/*
  This is particularly suited to Ruby on Rails with accepts_nested_attributes_for. Apply
  addsNestedAttribute onto an a tag that links to a 'new' action for the nested attribute.
  This action should respond to JSON, and provide a response in the following format:
  
    {"fields":{"name":"text","body":"textarea"},"model":"post","nested_model":"comment"}
  
*/
(function($){
  jQuery.ajaxifyNestedAttributes = {
    util : {
      _new : function(url, target, method, options){
        if (jQuery.ajaxifyNestedAttributes.cache[url]) {
          // pull from memory if possible
          jQuery.ajaxifyNestedAttributes.util._add_to_dom(jQuery.ajaxifyNestedAttributes.cache[url], target, method, options);
        } else {
          // pull data from server
          $.get(url, function(data) {
            jQuery.ajaxifyNestedAttributes.util._add_to_dom(data, target, method, options);
          },
          'json');
        }
      },
      _add_to_dom : function(json, target, method, options){
        // check data integrity
        if (typeof(json.model) === "undefined" || typeof(json.nested_model) === "undefined"){
          throw("ajaxifyNestedAttributes: no model data returned from server");
        };
        if (typeof(json.fields) === "undefined"){
          throw("ajaxifyNestedAttributes: no fields returned from server");
        };
        // these are how fields will be named for the nested attributes
        var id = new Date().getTime();
        var prefix = json.model+ "["+ json.nested_model +"_attributes]["+ id +"]";

        // prepare target for insertion
        var target = jQuery(target);
        var wrapper = jQuery(document.createElement(options['wrapper'])).addClass(options['wrapperClass']).hide().appendTo(target);

        // process fields from JSON
        jQuery.each(json.fields, function(name,tag){
          if (tag == 'text' || tag == 'password') {
            var type = tag, tag = 'input';
          }
          var field = document.createElement(tag);
          if (type) field.type = type;
          
          jQuery(field).attr('name', prefix+"["+name+"]").appendTo(wrapper);
        });
        // add a delete field
        var remove = document.createElement('input');
        remove.type = 'hidden';
        jQuery(remove).attr('name', prefix+"[_delete]").appendTo(wrapper);
        
        
        // add fields to DOM
        jQuery.ajaxifyNestedAttributes.util._method(method).call(wrapper);
        
        // cache JSON in memory, so repeat action doesn't require HTTP request
        jQuery.ajaxifyNestedAttributes.cache[url] = data;
      },
      _delete : function(el, method, parent, options){
        var selector = options['wrapperClass']==undefined ? options['wrapper'] : options['wrapper']+'.'+options['wrapperClass'];
        var wrapper = jQuery(el).parents(selector).eq(parent);
        wrapper.find('input').each(function(input){
          if (input.attr('name').match(/_delete/)) {
            input.val(1);
            return false;
          };
        });
        jQuery.ajaxifyNestedAttributes.util._method(method).call(parent);
      },
      _method : function(method){
        switch(method) {
          case 'show':
            return jQuery.fn.show;
            break;
          case 'hide':
            return jQuery.fn.hide;
            break;
          case 'fadeIn':
            return jQuery.fn.fadeIn;
            break;
          case 'fadeOut':
            return jQuery.fn.fadeOut;
            break;
          case 'slideIn':
            return jQuery.fn.slideIn;
            break;
          case 'slideOut':
            return jQuery.fn.slideOut;
            break;
        }
      }
    },
    settings : {
      wrapper : 'div',
      wrapperClass : null
    },
    cache : {}
  }
  
  //  addsNestedAttribute
  //    ex. $('a#new_comment').addsNestedAttribute('#comments', 'fadeIn', {'wrapper':'span'});
  //    target : jQuery selector for tag to insert new elements into
  //    method : the method with which to show new elements. defaults to 'show'.
  //    options :
  //      wrapper : the type of element to wrap new inputs into. defaults to 'div'.
  //      wrapperClass : class to apply to wrapper
  //
  jQuery.fn.addsNestedAttribute = function(target, method, options){
    if (target==undefined) throw("no target selector for addsNestedAttribute");
    if (options==undefined){
      options = method;
      method = 'show';
    }
    options = jQuery.extend({}, jQuery.ajaxifyNestedAttributes.settings, options);
    
    this.live('click', function(e){
      e.preventDefault();
      var url = jQuery(this).attr('href');
      if (url==undefined) throw("no url found for addsNestedAttribute");
      jQuery.ajaxifyNestedAttributes.util._new(url, target, method, options);
    });
    
    return this;
  };
  
  //  deletesNestedAttribute
  //    ex. $('a.delete').deletesNestedAttribute('fadeOut', 0, {'wrapper':'span'});
  //      -- fadesOut the first <span> among the link's parents
  //    ex. $('a.delete).deletesNestedAttribute('slideUp', {'wrapperClass':'comments'});
  //      -- slides up the first $('div.comments') among the link's parents
  //    method : method by which to hide parent. defaults to 'hide'
  //    parent : 0-indexed count of parents to get the main parent of nested fields
  //    options :
  //      wrapper : the type of the element that wraps fields. defaults to 'div'.
  //      wrapperClass : makes the parent selector more precise
  //
  jQuery.fn.deletesNestedAttribute = function(method, parent, options){
    if (typeof(method)=='object'){
      options = method;
      parent = 0;
      method = 'hide';
    } else if (typeof(method)=='number'){
      options = parent;
      parent = method;
      method = 'hide';
    } else if (typeof(parent)=='object'){
      options = parent;
      parent = 0;
    }
    options = jQuery.extend({}, jQuery.ajaxifyNestedAttributes.settings, options);
    
    this.live('click', function(e){
      e.preventDefault();
      jQuery.ajaxifyNestedAttributes.util._delete(this, method, parent, options);
    });
    
    return this;
  };
})(jQuery);
