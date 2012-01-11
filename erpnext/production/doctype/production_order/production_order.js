
cur_frm.cscript.onload = function(doc, dt, dn) {
  if (!doc.posting_date) doc.transaction_date = dateutil.obj_to_str(new Date());
  if (!doc.status) doc.status = 'Draft';

  cfn_set_fields(doc, dt, dn);

  if (doc.origin != "MRP"){
    doc.origin = "Manual";
    set_field_permlevel('production_item', 0);
    set_field_permlevel('bom_no', 0);
    set_field_permlevel('consider_sa_items',0);
  }
}

// ================================== Refresh ==========================================
cur_frm.cscript.refresh = function(doc, dt, dn) { 
  cfn_set_fields(doc, dt, dn);
}

var cfn_set_fields = function(doc, dt, dn) {
  if (doc.docstatus == 1) {
    if (doc.status != 'Stopped' && doc.status != 'Completed')
	  cur_frm.add_custom_button('Stop!', cur_frm.cscript['Stop Production Order']);
    else if (doc.status == 'Stopped')
      cur_frm.add_custom_button('Unstop', cur_frm.cscript['Unstop Production Order']);

    if (doc.status == 'Submitted' || doc.status == 'Material Transferred' || doc.status == 'In Process'){
      cur_frm.add_custom_button('Transfer Material', cur_frm.cscript['Transfer Material']);
      cur_frm.add_custom_button('Backflush', cur_frm.cscript['Backflush']);
    } 
  }
}


// ==================================================================================================

cur_frm.cscript.production_item = function(doc, dt, dn) {
  get_server_fields('get_item_detail',doc.production_item,'',doc,dt,dn,1);
}

// Stop PRODUCTION ORDER
//
cur_frm.cscript['Stop Production Order'] = function() {
  var doc = cur_frm.doc;
  var check = confirm("Do you really want to stop production order: " + doc.name);
  if (check) {
    $c_obj(make_doclist(doc.doctype, doc.name), 'stop_unstop', 'Stopped', function(r, rt) {cur_frm.refresh();});
	}
}

// Unstop PRODUCTION ORDER
//
cur_frm.cscript['Unstop Production Order'] = function() {
  var doc = cur_frm.doc;
  var check = confirm("Do really want to unstop production order: " + doc.name);
  if (check)
      $c_obj(make_doclist(doc.doctype, doc.name), 'stop_unstop', 'Unstopped', function(r, rt) {cur_frm.refresh();});
}

cur_frm.cscript['Transfer Material'] = function() {
  var doc = cur_frm.doc;
  cur_frm.cscript.make_se(doc, process = 'Material Transfer');
}

cur_frm.cscript['Backflush'] = function() {
  var doc = cur_frm.doc;
  cur_frm.cscript.make_se(doc, process = 'Backflush');
}

cur_frm.cscript.make_se = function(doc, process) {
  var se = LocalDB.create('Stock Entry');
  se = locals['Stock Entry'][se];
  se.purpose = 'Production Order';
  se.process = process;
  se.posting_date = doc.posting_date;
  se.production_order = doc.name;
  se.fiscal_year = doc.fiscal_year;
  se.company = doc.company;
  
  loaddoc('Stock Entry', se.name);
}


// ==================================================================================================
cur_frm.fields_dict['production_item'].get_query = function(doc) {
   return 'SELECT DISTINCT `tabItem`.`name`, `tabItem`.`description` FROM `tabItem` WHERE (IFNULL(`tabItem`.`end_of_life`,"") = "" OR `tabItem`.`end_of_life` = "0000-00-00" OR `tabItem`.`end_of_life` > NOW()) AND `tabItem`.docstatus != 2 AND `tabItem`.is_pro_applicable = "Yes" AND `tabItem`.%(key)s LIKE "%s" ORDER BY `tabItem`.`name` LIMIT 50';
}

cur_frm.fields_dict['project_name'].get_query = function(doc, dt, dn) {
  return 'SELECT `tabProject`.name FROM `tabProject` WHERE `tabProject`.status = "Open" AND `tabProject`.name LIKE "%s" ORDER BY `tabProject`.name ASC LIMIT 50';
}

cur_frm.fields_dict['bom_no'].get_query = function(doc)  {
  if (doc.production_item){
    return 'SELECT DISTINCT `tabBill Of Materials`.`name` FROM `tabBill Of Materials` WHERE `tabBill Of Materials`.`is_active` = "Yes" AND `tabBill Of Materials`.docstatus = 1 AND `tabBill Of Materials`.`item` = "' + cstr(doc.production_item) + '" AND`tabBill Of Materials`.%(key)s LIKE "%s" ORDER BY `tabBill Of Materials`.`name` LIMIT 50';
  }
  else {
    alert(" Please Enter Production Item First.")
  }
}

