import { jsonURL, surveyID, surveyData } from "./private.js";


// todo:change url based on status
 // edit existing = if failed || pending find the stop id in surveyData()
 // set url to '' if approved
 // attach to setStatus();



//STATIC URLS
//HTML SECTION SELECTORS
const list_div = document.getElementById("list");
const item = document.querySelector("button_popup");
const button_popup = document.querySelector(".button_popup");
let stop_search = document.getElementById("search").value;
const init = document.getElementById("init-search");
const stopButton = document.getElementById("main");
let searchData;

// JAVASCRIPT VARIABLES
let stops, filtered_stops;
let filtered = false;
let assessments = {
    failed: [],
    approved: [],
    pending: [],
};
let failedList = [];

//POLYFILLS
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    let el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

// get survey data common function
const get_survey_data = async (url) => {
  const response = await fetch(url);
  const json = await response.json();
  let data = json.features;
  stops = data;
  return data;
};

// clears out list of stops and searchbar
const clear_data = async () => {
  list_div.innerHTML = "";
  document.getElementById("search").value = "";
  return;
};

// uses assessment status and returns color for css
const setStatus = (stop) => {
    if (assessments['failed'].includes(String(stop.properties.stopID))) {
        return 'red';
    } else if (assessments['approved'].includes(String(stop.properties.stopID))) {
        return 'green';
    } else if (assessments['pending'].includes(String(stop.properties.stopID))) {
        return 'yellow';
    } else {
        return 'blue'
    }
}

const render = async function(d){
  // SORTED DATA BY stop NUMBER
    const sorted_data = await d.sort(function (a, b) {
        if (a.properties.stopID < b.properties.stopID) {
        return -1;
        }
        if (b.properties.stopID < a.properties.stopID) {
        return 1;
        }
        return 0;
    });

    list_div.innerHTML = "";
    await sorted_data.forEach((element) => {
        list_div.innerHTML +=
            `<div id='${element.properties.stopID}' class='button_popup fl w-100 '>
                <a
                    data-oid = '${element.properties.objectid}'
                    data-assessStatus = '${element.properties.approved}'
                    data-approvalComments = '${element.properties.approvalComments }'


                    class='openpop center fl w-100 link dim br2 ph3 pv2 mb2 dib white bg-${setStatus(element)}'>
                    <ul>
                        <li class='f3 helvetica'><b>Stop ID:</b> ${element.properties.stopID}
                        </li>
                        <li class='f3 helvetica'><b>Stop Name:</b> ${element.properties.stopName}
                        </li>    
                    </ul>
                </a>
            </div>`;
    });
};

const searching = (stop_search) => {
  list_div.innerHTML = "Data is loading...";
  get_survey_data(stop_search).then((data) => {
    render(data);
    searchData = data;
  });
};

const getAssessments = (url) => {
    get_survey_data(url).then((data) => { 
        data.forEach(el => {
            if (el.attributes.approved == "no" || el.attributes.approvalComments != null){
                document.getElementById('notification-icon').src = 'assets/notification2.svg';
                assessments['failed'].push(el.attributes.stopID);
            } else if (el.attributes.approved == "yes" ) {
                assessments['approved'].push(el.attributes.stopID);
            } else if (el.attributes.approved == null) {
                document.getElementById('mailbox-icon').src = 'assets/mailbox2.svg';
                assessments['pending'].push(el.attributes.stopID);
            }
        })
    });
};

const getIssues = async (type) => {
    list_div.innerHTML = "Data is loading...";
    const crossRef = async () => {
        let list = [];
        assessments[type].forEach(async item => {
            await get_survey_data(await jsonURL(item))
                .then(data => {
                    list.push(data[0]);
                })
        })
        return await list;
    };
    crossRef().then(async data => {
        let div = '';
        setTimeout(async () => {
            await data.forEach(async (element) => {
                list_div.innerHTML = ''
                list_div.innerHTML +=
                `<div id='${element.properties.stopID}' class='button_popup fl w-100 '>
                    <a
                        data-oid = '${element.properties.objectid}'
                        data-assessStatus = '${element.properties.approved}'
                        data-approvalComments = '${element.properties.approvalComments }'
    
    
                        class='openpop center fl w-100 link dim br2 ph3 pv2 mb2 dib white bg-${setStatus(element)}'>
                        <ul>
                            <li class='f3 helvetica'><b>Stop ID:</b> ${element.properties.stopID}
                            </li>
                            <li class='f3 helvetica'><b>Stop Name:</b> ${element.properties.stopName}
                            </li>    
                        </ul>
                    </a>
                </div>`;
                return await div;
            })
            
        }, 3000);
    })
};

const clickEvent = async (event) => {
    event.preventDefault();
    const iframe_exists = document.getElementById("ifrm");
    stop_search = document.getElementById("search").value;
    const iframe = event.target.closest("#iframe");
    const search = event.target.closest("#search");
    const notification = event.target.closest('#notification-icon');
    const mailbox = event.target.closest('#mailbox-icon');
    console.log(event)

    if (((event.type == "submit" && event.target.closest('#form-search'))
        ||
        (event.type == 'click' && event.target.closest('#search')))
        && stop_search != ""
        && !iframe_exists) {
            searching(jsonURL(stop_search));
            return;
  }

  // CLOSE IFRAME / CLICK OFF IFRAME WHEN ITS OPEN
    else if (!iframe && iframe_exists) {
        // CLOSE IFRAME
        iframe_exists.parentNode.removeChild(iframe_exists);
        return;

    } else if (notification) {
        getIssues('failed');
        return;
    } else if (mailbox) {
        getIssues('pending');
        return;
    // SEARCH CLICK!!!
    } else if (search) {
        if (stop_search != "") {
        searching(stop_search);
        } else if (stop_search == "" && filtered) {
        render(vehicles);
        return;
        }
        // CLICK LIST ELEMENT AND OPEN IFRAME!!!
    } else if (event.target.closest(".openpop")) {
        let item = event.target.closest(".openpop");
        console.log(item);
        console.log(item.dataset);

    let url = `https://survey123.arcgis.com/share/${surveyID()}?field:stopID=${
      item.dataset.stopid
    }
                    &field:onSt=${item.dataset.onst} 
                    &field:atSt=${item.dataset.atst} 
                    &field:stopName=${item.dataset.stopname} 
                    &field:installInfo=${item.dataset.installinfo} 
                    &field:routes=${item.dataset.routes} 
                    &field:tParkPoles=${item.dataset.tparkpoles} 
                    &field:tParkSigns=${item.dataset.tparksigns} 
                    &field:installSurface=${item.dataset.installsurface}
                    &field:installBusStopPole=${
                      item.dataset.installpole == "0" ? "no" : "yes"
                    }
                    &field:assignedPos=${item.dataset.instpos} 
                    &field:parkSignRear=${item.dataset.parksignrear} 
                    &field:parkSignNSFront=${item.dataset.parksignnsfront} 
                    &field:parkSignMBFront=${item.dataset.parksignmbfront} 
                    &field:parkSignFarside=${item.dataset.parksignfarside} 
                    &field:gpsLat${item.dataset.gpslat}
                    &field:gpsLat${item.dataset.gpslon}`;
    const ifrm = document.createElement("iframe");
    const el = document.getElementById("marker");
    const main = document.querySelector("#main");

    ifrm.setAttribute("id", "ifrm"); // assign an id
    ifrm.setAttribute(`src`, url);

    main.parentNode.insertBefore(ifrm, el);
    return;
  }
};

clear_data();
getAssessments(surveyData());
window.addEventListener("click", clickEvent, false);
window.addEventListener("submit", clickEvent, false);
