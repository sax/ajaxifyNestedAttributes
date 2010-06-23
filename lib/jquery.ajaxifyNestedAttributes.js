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
            // cache JSON in memory, so repeat action doesn't require HTTP request
            jQuery.ajaxifyNestedAttributes.cache[url] = data;
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
        var _id = json.model+"_"+json.nested_model+"_"+id;
        var _name = json.model+ "["+ json.nested_model +"_attributes]["+ id +"]";

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
          
          jQuery(field).attr('name', _name+"["+name+"]").attr('id', _id+'_'+name).appendTo(wrapper);
          if (options['label'] == true){
            var label = jQuery(document.createElement('label')).attr('for', _id+"_"+name).html(name).insertBefore(field);
          }
        });
        // add a delete field
        var remove = document.createElement('input');
        remove.type = 'hidden';
        jQuery(remove).attr('name', _name+"[_destroy]").appendTo(wrapper);
        
        // add fields to DOM
        jQuery.ajaxifyNestedAttributes.util._method(method).call(wrapper);
      },
      _delete : function(el, method, parent, options){
        var selector = options['wrapperClass']==undefined ? options['wrapper'] : options['wrapper']+'.'+options['wrapperClass'];
        var wrapper = jQuery(el).parents(selector).eq(parent);
        wrapper.find('input').each(function(input){
          if (input.attr('name').match(/_destroy/)) {
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
          case 'slideDown':
            return jQuery.fn.slideDown;
            break;
          case 'slideUp':
            return jQuery.fn.slideUp;
            break;
        }
      }
    },
    settings : {
      wrapper : 'div',
      wrapperClass : null,
      label : true
    },
    cache : {}
  }
  
  //  addsNestedAttribute
  //    ex. $('a#new_comment').addsNestedAttribute('#comments', 'fadeIn', {'wrapper':'span'});
  //    target : str :  jQuery selector for tag to insert new elements into
  //    method : str : the method with which to show new elements. defaults to 'show'.
  //    options :
  //      wrapper : str : the type of element to wrap new inputs into. defaults to 'div'.
  //      wrapperClass : str : class to apply to wrapper
  //      label : bool : whether or not to add label tags
  //
  jQuery.fn.addsNestedAttribute = function(target, method, options){
    if (target==undefined) throw("no target selector for addsNestedAttribute");
    if (typeof(method)=='object'){
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
  //    method : str : method by which to hide parent. defaults to 'hide'
  //    parent : int : 0-indexed count of parents to get the main parent of nested fields
  //    options :
  //      wrapper : str : the type of the element that wraps fields. defaults to 'div'.
  //      wrapperClass : str : makes the parent selector more precise
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
