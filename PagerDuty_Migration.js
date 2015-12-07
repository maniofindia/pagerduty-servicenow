/*
 * Must be run from backgroup script as a user with the elevated security_admin role
 */

// migrate incident id values
migrateIncidents();

// migrate group attributes from legacy update set application to the new Fuji store app
migrateGroups();

//disable legacy business rules
var legacyRules =["cb4e60d04d976100c33a943ecf043e06",
                  "d742e8484dd36100c33a943ecf043e82",
                  "23182473fd676100c33aa767053a3548",
                  "275a4b684d9b6100c33a943ecf043e43"];
disableRecords("sys_script", legacyRules);

//disable legacy processor
disableRecords("sys_processor", "5c994695240b210012e7b8d269ce7dc6");

//disable legacy application menu
disableRecords("sys_app_application", "cf52bc159964310012e7cc52061584d2");

//disable legacy dictionary elements
disableLegacyElements("incident", ["u_pagerduty", "u_pagerduty_id", "u_pagerduty_key"]);
disableLegacyElements("sys_user_group", ["u_pagerduty_policy", "u_pagerduty_service"]);



function migrateIncidents() {
    var legacyField = "u_pagerduty_id";
    var newField = "x_pd_integration_incident";

    var inc = new GlideRecord("incident");
    inc.addNotNullQuery(legacyField);
    inc.addNullQuery(newField);
    inc.query();
    gs.info("PagerDuty Migration: migration incident query '{0}' found {1} incident needed migration", inc.getEncodedQuery(), inc.getRowCount());
    while (inc.next()) {
        var legacyID = inc.getValue(legacyField);
        inc.setValue(newField, legacyID);
        gs.info("PagerDuty Migration: MIGRATING incident {0}, id:{1}", inc.getDisplayValue(), legacyID);
        inc.setWorkflow(false);
        inc.autoSysFields(false);
        inc.update();
    }

}

function migrateGroups() {
    var legacyServiceField = "u_pagerduty_service";
    var newServiceField = "x_pd_integration_pagerduty_service";
    var legacyPolicyField = "u_pagerduty_policy";
    var newPolicyField = "x_pd_integration_pagerduty_escalation";

    var group = new GlideRecord("sys_user_group");
    group.addNotNullQuery(legacyServiceField);
    group.addNotNullQuery(legacyPolicyField);
    group.addNullQuery(newServiceField);
    group.addNullQuery(newPolicyField);
    group.query();
    gs.info("PagerDuty Migration: migration group query '{0}' found {1} groups needed migration", group.getEncodedQuery(), group.getRowCount());
    while (group.next()) {
        var legacyService = group.getValue(legacyServiceField);
        var legacyPolicy = group.getValue(legacyPolicyField);
        group.setValue(newServiceField, legacyService);
        group.setValue(newPolicyField, legacyPolicy);
        gs.info("PagerDuty Migration: MIGRATING group {0}, service:{1}, policy:{2}", group.getDisplayValue(), legacyService, legacyPolicy);
        group.update();
    }
}

function disableRecords(table, ids) {
    var gr = new GlideRecord(table);
    gr.addQuery("sys_id", ids);
    gr.addActiveQuery();
    gr.query();
    gs.info("PagerDuty Migration: query for legacy {0} table: '{1}' = {2} records", table, gr.getEncodedQuery(), gr.getRowCount());
    while (gr.next()) {
        gr.setValue("active", false);
        gs.info("PagerDuty Migration: DISABLING legacy {0}: {1}", table, gr.getDisplayValue());
        gr.update();
    }
}

function disableLegacyElements(table, elements) {
    var gr = new GlideRecord("sys_dictionary");
    gr.addQuery("name", table);
    gr.addQuery("element", elements);
    gr.addActiveQuery();
    gr.query();
    gs.info("PagerDuty Migration: query for legacy {0} table elements: '{1}' = {2} records", table, gr.getEncodedQuery(), gr.getRowCount());
    while (gr.next()) {
        gr.setValue("active", false);
        gs.info("PagerDuty Migration: DISABLING legacy element {0}.{1}", gr.getValue("name"), gr.getValue("element"));
        gr.update();
    }
}


//manually remove legacy fields from form and list views
gs.info("PagerDuty Migration ******* MANUAL STEPS REQUIRED *********");
gs.info("PagerDuty Migration: modify the group and incident form and list views to remove legacy fields");


