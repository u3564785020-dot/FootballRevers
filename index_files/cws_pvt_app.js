 //Set prices in store currency format 
 function format_cws_prices()
 {
        if (display_currency_code=='yes' && Shopify.currency.active!='XPF') {
          var cwscurrency=Shopify.currency.active;
        }else{
          var cwscurrency='';
        }
  
        jQuery("table#variants td[class*='price_col']").each(function() {
        var var_id_val = jQuery(this).closest("tr").attr("data-variant-id");
        
        //Price - Sale price-
           var cws_var_price = variantData[var_id_val]['price'];

           if(variantData[var_id_val]['compare_at_price']!='nc') {
           var cws_comp_price = variantData[var_id_val]['compare_at_price'];
           }
          
        
                              
        if (typeof cws_comp_price !== "undefined") {
          cws_comp_price = Shopify.formatMoney(cws_comp_price,variant_money_format);

          if(variant_money_format.indexOf("amount_no_decimals_with_space_separator") != -1){
            cws_comp_price = cws_comp_price.replace(/\./g, " ");
          }
          jQuery("table#variants tr[data-variant-id='"+var_id_val+"']").find("span.cws_compare_price").html(cws_comp_price+' '+ cwscurrency);                                  
        }else{
            
         jQuery("table#variants tr[data-variant-id='"+var_id_val+"']").find("span.cws_compare_price").remove();      
        } 
        
        cws_var_price = Shopify.formatMoney(cws_var_price,variant_money_format);  
        
        if(variant_money_format.indexOf("amount_no_decimals_with_space_separator") != -1){
            cws_var_price = cws_var_price.replace(/\./g, " ");
        }

        jQuery("table#variants tr[data-variant-id='"+var_id_val+"']").find("span.cws_var_price").html(cws_var_price+' '+ cwscurrency);
        });         
 }

  //Check Product options value
  function checkOptionValue(opt_val) 
  {
    return opt_val == "blank_opt";
  } 

  //Hide themes elements
  function cws_hide_elements()
  { 
      var cws_hide_elements = "";
      if(hide_add_to_cart_btn == "yes") {
        cws_hide_elements += addtocart_selectors+'{ display: none !important; }';
      }
              
      if(hide_variant_dropdowns == "yes") {
        cws_hide_elements += swatch_selectors+'{ display: none !important; }';     
      }
                
      if(hide_qty_box == "yes") {
        cws_hide_elements += qty_selectors+'{ display: none !important; }';
      }
    
      if(cws_hide_elements != "") {
       jQuery('head').append('<style type="text/css">'+cws_hide_elements+'</style>');
      }
  }
    
  //Show themes elements on server errors for eg. 500,502 etc.
  function cws_show_elements()
  { 
      var cws_show_elements = "";
      cws_show_elements += addtocart_selectors+'{ display: block !important; }';
      cws_show_elements += swatch_selectors+'{ display: block !important; }';     
      cws_show_elements += qty_selectors+'{ display: block !important; }';
     
     jQuery('head').append('<style type="text/css">'+cws_show_elements+'</style>'); 
  }
    
  //Check input is numeric or not
  function isNumber(evt) 
  {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
                
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    return false;
    }
    
    return true;            
  }
  
  //Store items
  function pushitems(currentQty,variant_id) 
  {
     //If Variant is already added then update qty.
     Shopify.queue = jQuery.grep(Shopify.queue, function(e){ 
                    
        if(e.variantId == variant_id) {
            return false;
        } else {
            return true;
        }
      }); 
      
      //Push Variants to Queue
      Shopify.queue.push({'variantId': variant_id,'quantity': currentQty});    
   }
  
  //Remove Items from current list
  function current_list_remove(remove_varid)
  {
        Shopify.queue = jQuery.grep(Shopify.queue, function(e){ 
  
        if(e.variantId == remove_varid) {
            return false;
        } else {
            return true;
        }
        });   
   }
  
  //Get Product Variants List
  function getVariantsTable(action,filter_query)
  {      
    if(filter_query == "") {
       var data_params = "domain="+shop_domain+"&local="+local+"&product_id="+product_id+"&currency="+currency_code+"&action="+action+"&primary_market="+primary_market+"&app_version=latest";
    } else {
        var data_params = "domain="+shop_domain+"&local="+local+"&product_id="+product_id+"&currency="+currency_code+"&action="+action+filter_query+"&primary_market="+primary_market+"&app_version=latest";
    }
    
    //var variantDataJson = JSON.stringify(variantData);
 
    jQuery(".variant-loader").show();
    
    jQuery.ajax({
        type: "GET",
        dataType: 'jsonp',
        url: pvt_data_url,
        data: data_params,
         error: function (jqXHR, exception) {
                //If server error throughs such as: 500, 502 then client's original function of add to cart will run smoothly. 
                jQuery(".variant-loader").hide();
                cws_show_elements();
        },
        success: function(res) {
           
             if(res.html != null) {
                //For active charge clients display table and hide theme elements if any as per settings.-86/ASK
                cws_hide_elements();
             
                jQuery(".variant-loader").hide();
                
                if(jQuery("#cws_var_table").length>0) { 
                    jQuery("#cws_var_table").html(res.html);
                }
                
                format_cws_prices();

               if(out_of_stock == "yes") {
                 jQuery('#cws_var_table').find(".multi_variantcart").attr("disabled",true);
               }
            } else {      
                //For inactive charge - default theme elements will be displayed instead of PVT table.
                jQuery(".variant-loader").hide();
                cws_show_elements();
            }
        }
    });
   }

  //Multi addtocart
  function showCartPopup() 
  { 
    if (display_currency_code=='yes' && Shopify.currency.active!='XPF') {
      var cwscurrency=Shopify.currency.active;
    }else{
      var cwscurrency='';
    }

    jQuery.ajaxSetup({ cache: false }); //Important for IE11 - 
     
    jQuery.getJSON(cws_current_url.trim()+'/cart.js').done(function(cart) {
                    
                    if(redirect_cart_page == "yes") {
                        window.location.href=cws_current_url.trim()+"/cart";
                    } else {
          
                    jQuery(".variant-cartlist").css('display','block');
        
                    //Get text translation options from admin
                    var modal_header_txt = jQuery('#modal_header_txt').val();
                    var header_txt_1 = modal_header_txt.split('%s')[0];
                    var header_txt_2 = modal_header_txt.split('%s')[1];
                    var product_name = jQuery('#cws_product_name').val();
                    var product_qty = jQuery('#cws_product_qty').val();
                    var product_price = jQuery('#cws_product_price').val();
                    var modal_subtotal_txt = jQuery('#modal_subtotal_txt').val();
                    var view_btn_txt = jQuery('#modal_viewbtn_txt').val();
                    var continue_btn_txt = jQuery('#modal_contbtn_txt').val();
       
                    jQuery('head').append('<style type="text/css">@media only screen and (max-width:767px) {.variant-cartlist .cart_table thead { display:none; }.variant-cartlist .cart_table td:nth-of-type(1):before { content: "'+product_name+'"; }.variant-cartlist .cart_table td:nth-of-type(2):before { content: "'+product_qty+'"; } .variant-cartlist .cart_table td:nth-of-type(3):before { content: "'+product_price+'"; }}</style>');     
                    jQuery(".modal-header").find("#total_cnt").html(header_txt_1+cart.item_count+header_txt_2);
                    jQuery(".modal-body").find("#cart_header").html('<th>'+product_name+'</th><th>'+product_qty+'</th><th>'+product_price+'</th>');
                    jQuery(".modal-footer").find(".sub_total").html(''+modal_subtotal_txt+': <span class="sub_total_amount"></span>');
                    jQuery(".modal-footer").find(".cart-button").html('<a class="btn view_cart" href="'+cws_current_url.trim()+'/cart">'+view_btn_txt+'</a><a class="btn continue_btn">'+continue_btn_txt+'</a>');
                    
                    //Update floating count
                    jQuery(".cart_count").html(cart.item_count);
                    jQuery(".varitems-cart").html(cart.item_count);
        
                    var cart_row = "";
                    var pro_img = "";
                    jQuery('#variant-minicartlist').empty();
                    jQuery(".variant-cartlist .modal-body").show();
                    jQuery(".variant-cartlist .modal-footer").show();
                    
               
                    if(cart.item_count > 0) {
                        jQuery.each(cart.items, function(item_index,item_arr) {
                        cart_row = jQuery('<tr class="quick-cartitem" id="prditem-'+item_arr.id+'">');
          
                        if(item_arr.image != null) {
                        pro_img = item_arr.image;
                          
                        if(variant_img_size != "") {
                            var img_without_extension = pro_img.substr(0, pro_img.lastIndexOf('.')) || pro_img;
                            var img_ext = pro_img.split('.').pop();
                            img_ext = img_ext.substring(0, img_ext.indexOf('?v'));
                            pro_img = img_without_extension+"_"+variant_img_size+"."+img_ext;
                        }       
                } else {
                    pro_img = variant_no_image;
                }
                cart_row.append(jQuery('<td>').html('<a href="'+item_arr.url+'"><span class="pro_img"><img src="'+pro_img+'"/></span><span class="pro_title">'+item_arr.title+'</span></a>'));
                cart_row.append(jQuery('<td>').html('<p>'+item_arr.quantity+'</p>'));
                
                var cws_item_price=Shopify.formatMoney(item_arr.price, variant_money_format);
                if(variant_money_format.indexOf("amount_no_decimals_with_space_separator") != -1){
                    cws_item_price = cws_item_price.replace(/\./g, " ");
                }

                cart_row.append(jQuery('<td>').html('<span>'+cws_item_price+' '+ cwscurrency +'</span>'));
            
                jQuery('#variant-minicartlist').append(cart_row);  
            });

            var cws_total_price=Shopify.formatMoney(cart.total_price, variant_money_format);
                if(variant_money_format.indexOf("amount_no_decimals_with_space_separator") != -1){
                    cws_total_price = cws_total_price.replace(/\./g, " ");
                }
            jQuery(".modal-footer").find(".sub_total_amount").html('<span>'+cws_total_price+' '+ cwscurrency +'</span>');
       } else {
          jQuery(".variant-cartlist .modal-body").hide();
          jQuery(".variant-cartlist .modal-footer").hide();
        }
        }
     });
   }
  
  //Reset current list
  function reset_multicartlist()
  {
     jQuery(".multi_variantcart").attr("disabled",false);
    
     jQuery("p").remove(".err_text");
     
     jQuery('#cws_var_table .cws-number-only').val(default_qty_val).trigger("change");
     
     if(multicart_errors.length > 0) {
        
        jQuery("#cws_var_table .multicart_err").css("display","block");
            
        var temp_err = multicart_errors;
        
        multicart_errors = [];
        
        jQuery.each(temp_err,function(key,value) {
            jQuery("#cws_var_table .multicart_err").append("<p class='err_text' id='err_text_"+key+"'>"+value.err_res+"</p>");
        });   
      
        setTimeout(function() { jQuery('html,body').animate({scrollTop: jQuery("div.cwsPvtApp").offset().top });}, 200);      
     } else {
        jQuery("#cws_var_table .multicart_err").css("display","none");
    }
   }
  
  //Multi Add to cart
  Shopify.cwsMoveAlong = function() {
    
    /*var error1_text1 = jQuery('#error1_text1').val();
    var error1_text2 = jQuery('#error1_text2').val();
    var error2_text1 = jQuery('#error2_text1').val();
    var error2_text2 = jQuery('#error2_text2').val();
    var error3_text1 = jQuery('#error3_text1').val();*/
     
    //If we still have requests then process the next one.
    if(Shopify.queue.length) {
            var request = Shopify.queue.shift(); 
            var data = 'id='+ request.variantId + '&quantity='+request.quantity;
          
            jQuery("#cws_var_table .multi_variantcart").attr("disabled",true);
           
            jQuery.ajax({
                type: 'POST',
                url: cws_current_url.trim()+'/cart/add.js',
                dataType: 'json',
                data: data,
                success: function(res){
                    Shopify.cwsMoveAlong();
                },
                error: function(XMLHttpRequest,textStatus){
                    var response = eval('(' + XMLHttpRequest.responseText + ')');
                    response = response.description;
                    /*response = response.replace("You can only add",error1_text1);
                    response = response.replace("to the cart.",error1_text2);
                    response = response.replace("All",error2_text1);
                    response = response.replace("are in your cart.",error2_text2);
                    response = response.replace("You can't add more",error3_text1);*/
                
                    multicart_errors.push({'err_res':response});
                   
                    //If it is not last one Move Along
                    if (Shopify.queue.length){
                        Shopify.cwsMoveAlong();
                    } else {
                        showCartPopup();
                        reset_multicartlist(); 
                    }
                }
           });
     } else {
         showCartPopup();
         reset_multicartlist();
     } 
  };

  jQuery(document).ready(function() {
                
                cws_hide_elements();       
                
                jQuery("body").css("opacity", 1);
                jQuery("html").css("opacity", 1);
       
                //Show/hide floating side cart
                if(show_floating_cart == "yes") {
              
                //If callforprice setting is being disabled then only show floating cart. 
                if(hide_price == "no") {
                    jQuery("#flyToCart").show();
                }
                } else {
                    jQuery("#flyToCart").remove();
                }
              
                //Onload get variants
                getVariantsTable("onload","");
              
                //Product filter search
                jQuery(document).on('click','#cws_variant_search',function(e){
                    e.preventDefault();
           
                    var filter_query = "";
                    
                    if(jQuery("#cws_option_1").length) {
                    filter_query += "&option1="+encodeURIComponent(jQuery("#cws-varaint-filter #cws_option_1").val());
                    }
            
                    if(jQuery("#cws_option_2").length) {
                    filter_query += "&option2="+encodeURIComponent(jQuery("#cws-varaint-filter #cws_option_2").val());   
                    }
                
                    if(jQuery("#cws_option_3").length) {
                    filter_query += "&option3="+encodeURIComponent(jQuery("#cws-varaint-filter #cws_option_3").val());
                    }
            
                    getVariantsTable("search",filter_query);
                });
          
                //Product options on change enable/disable filter button
                jQuery(document).on('change','select[id^=cws_option]:visible',function() {
                    var option_value_arr = [];
                                
                    if(jQuery('select#cws_option_1').length>0) {
                       option_value_arr.push(jQuery('select#cws_option_1').val());
                    }
                            
                    if(jQuery('select#cws_option_2').length>0) {
                       option_value_arr.push(jQuery('select#cws_option_2').val());
                    }
                            
                    if(jQuery('select#cws_option_3').length>0) {
                        option_value_arr.push(jQuery('select#cws_option_3').val());
                    }     
                  
                    //If all option values are blank then only disabled filter button.
                     if(option_value_arr.every(checkOptionValue)){
                        jQuery("#cws_variant_search").attr("disabled",true);
                     } else {
                        jQuery("#cws_variant_search").removeAttr("disabled");
                     }
                });
                  
                //Reset Product filter
                jQuery(document).on('click','#cws_variant_reset',function(e){
                    e.preventDefault();
                    getVariantsTable("onload","",1);
                });
              
                //Allowed to type number only
                jQuery(document).on('keypress','#cws_var_table .cws-number-only',function(evt) {
                    var isno = isNumber(evt);
                    if(!isno) {
                        return false;
                    }
                });
              
                //Qty increment
                jQuery(document).on('click','#cws_var_table [id^=qtyplus]',function() {  
                    var ele_id = jQuery(this).siblings("#cws_var_table .cws-number-only").attr('id');
                    if (ele_id==undefined) {
                      var ele_id = jQuery(this).closest('.qty-box').find('.cws-number-only').attr('id');;
                    }
                    var variant_id = ele_id.replace("cws_", "");
                    var qtyInput = jQuery("#"+ele_id);
                    var currentVal = parseInt(qtyInput.val());
                    var qtyMax = parseInt(qtyInput.attr('data-variantmax'));
            
                    if(currentVal >= qtyMax) {
                        //Get Stock Alert Message from general settings.
                        var stock_alert = jQuery("#cws_stock_alert").val();
                        var alert_1 = stock_alert.split('%s')[0];
                        var alert_2 = stock_alert.split('%s')[1];
                        alert(alert_1+qtyMax+alert_2);
                        qtyInput.val(qtyMax);
                    } else {
                        qtyInput.val(currentVal+1); 
                    }
              });  
              
                //Qty decrement
                jQuery(document).on('click','#cws_var_table [id^=qtyminus]',function() { 
                    var ele_id = jQuery(this).siblings("#cws_var_table .cws-number-only").attr('id');
                    if (ele_id==undefined) {
                      var ele_id = jQuery(this).closest('.qty-box').find('.cws-number-only').attr('id');;
                    }
                    var variant_id = ele_id.replace("cws_", "");
                    var qtyInput = jQuery("#"+ele_id);
                    var currentVal = parseInt(qtyInput.val());
    
                    if(currentVal >= 1) {
                        qtyInput.val(currentVal - 1);
                    } else {
                        current_list_remove(variant_id);
                    }
                }); 
              
                //Check max available stock qty on key up
                jQuery(document).on('keyup','#cws_var_table .cws-number-only',function() {
                    var ele_id = jQuery(this).attr('id');
                    var qtyInput = jQuery("#"+ele_id);
                    var var_qty = parseInt(qtyInput.val()) || 0;
                    var qtyMax = parseInt(qtyInput.attr('data-variantmax'));
                    var variant_id = ele_id.replace("cws_", "");
      
                    if(var_qty > qtyMax) {
                        //Get Stock Alert Message from general settings
                        var stock_alert = jQuery("#cws_stock_alert").val();
                        var alert_1 = stock_alert.split('%s')[0];
                        var alert_2 = stock_alert.split('%s')[1];
                        alert(alert_1+qtyMax+alert_2);
                        qtyInput.val(qtyMax);   
                    } 
      
                    if(var_qty < 1) {
                    current_list_remove(variant_id);
                    } 
                });
                
                //On click of multiple addtocart button
                jQuery(document).on('click','#cws_var_table .multi_variantcart',function(e) {
                e.preventDefault();
  
                var add_to_cart_btn_text = jQuery('#single_add_to_cart_btn_text').val();
                jQuery('#cws-variants-tbl .single_atc .single_atc_btn_txt').html(add_to_cart_btn_text);
                jQuery('span[class^=\"cws_item_added\"]').remove();
    
                jQuery("#cws_var_table .cws-number-only").each(function() {
                    var ele_id = jQuery(this).attr("id");
                    var variant_id = ele_id.replace("cws_", "");
                    var qtyInput = jQuery("#"+ele_id);
                    var currentVal = parseInt(qtyInput.val()) || 0;
         
                    if(currentVal>0) {
                    pushitems(currentVal,variant_id);
                    }
            });
       
            if(Shopify.queue.length == 0) {
                alert("Sorry! no items were added, please fill quantity field first then click on Add to Cart button.");
            } else {
                Shopify.cwsMoveAlong();
            }
            });
              
            if(single_atc_status == "YES") {
                jQuery(document).on('click','[id^=single_atc]',function(){
                    var btn_id = jQuery(this).attr('id');
                    var single_var_id = btn_id.replace('single_atc_','');
                    var qty_val = parseInt(jQuery(this).closest('tr').find('input#cws_'+single_var_id).val());
                    var item_added_class = 'cws_item_added_'+single_var_id;
                    var cws_item_added_container_id = 'cws_item_added_container_'+single_var_id;
                   
                    //Check IF qty value is 0, then RETRUN
                    if(qty_val == 0) {
                    return;
                    }
                   
                    jQuery('#cws_var_table .multicart_err').hide();
                    jQuery('#cws_var_table .multicart_err p.err_text').remove();
                
                    var adding_btn_text = jQuery('#adding_btn_text').val();
                    var thank_you_btn_text = jQuery('#thank_you_btn_text').val();
                    var add_more_btn_text = jQuery('#add_more_btn_text').val();
                    var single_add_to_cart_btn_text = jQuery('#single_add_to_cart_btn_text').val();
                    var modal_viewbtn_txt = jQuery('#modal_viewbtn_txt').val();
                    var added_btn_text = jQuery('#added_btn_text').val();
    
                    jQuery('#cws-variants-tbl .single_atc_container').find('#'+single_var_id).html(adding_btn_text);
    
                    /*var error1_text1 = jQuery('#error1_text1').val();
                    var error1_text2 = jQuery('#error1_text2').val();
                    var error2_text1 = jQuery('#error2_text1').val();
                    var error2_text2 = jQuery('#error2_text2').val();
                    var error3_text1 = jQuery('#error3_text1').val();*/
              
                    jQuery('#'+cws_item_added_container_id).remove();
            
                    jQuery.ajaxSetup({ cache: false }); //Important for IE11 - 
              
                    jQuery.ajax({
                        type: 'POST',
                        url: cws_current_url.trim()+'/cart/add.js',
                        dataType: 'json',
                        data: { 'id': single_var_id,'quantity': qty_val },
                        success: function(res){     
                        
                        if(redirect_cart_page == "yes") {
                            window.location.href=cws_current_url.trim()+"/cart";
                        } else {
                            jQuery.getJSON(cws_current_url.trim()+'/cart.js').done(function(cart) {
                                jQuery('.cart_count').html(cart.item_count);
                                jQuery('.varitems-cart').html(cart.item_count);
                            });
                            
                            window.setTimeout(function() { jQuery('#cws-variants-tbl .single_atc_container').find('#'+single_var_id).html(thank_you_btn_text); }, 400);
                  
                            window.setTimeout(function() { jQuery('#cws-variants-tbl .single_atc_container').find('#'+single_var_id).html(add_more_btn_text); }, 1000);
                
                            if(jQuery('.'+item_added_class).length == 0) {
                                jQuery('<p class=\"cws_item_added_container\" id=\"'+cws_item_added_container_id+'\"><span class=\"'+item_added_class+' cws-pro-added\">'+added_btn_text+'<a href=\"'+cws_current_url.trim()+'/cart\" class=\"cws-view-cart\">'+modal_viewbtn_txt+'</a></span></p>').insertAfter( '#single_atc_'+single_var_id );
                            }
                        }
                    },
                    error: function(XMLHttpRequest,textStatus){
                        var response = eval('(' + XMLHttpRequest.responseText + ')');
                        
                        response = response.description;
                        
                        jQuery('#cws-variants-tbl .single_atc_container').find('#'+single_var_id).html(single_add_to_cart_btn_text);
                            
                        jQuery('#'+cws_item_added_container_id).remove();
                        /*response = response.replace('You can only add',error1_text1);
                        response = response.replace('to the cart.',error1_text2);
                        response = response.replace('All',error2_text1);
                        response = response.replace('are in your cart.',error2_text2);
                        response = response.replace("You can't add more",error3_text1);*/
                   
                        alert(response);
                    }
                });
            });   
        }
             
        //Close popup
        jQuery(document).on("click",'.cart_close,.continue_btn',function() {
            jQuery('.variant-cartlist').css('display','none');
        });
  
        //For mobile devices or when click outside of modal will close it
        jQuery(document).bind("click touchend",function(e) {
            if(jQuery('.variant-cartlist').is(e.target)) {    
                jQuery('.variant-cartlist').css('display','none');
            }
        });
  
        //On click of floating cart show cart popup
        jQuery(document).on('click','.cart_anchor',function(e){
            e.preventDefault();
            showCartPopup();
        });
   });