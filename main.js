const scriptProperties = PropertiesService.getScriptProperties();
const MEAL_CALENDAR_ID = scriptProperties.getProperty('MEAL_CALENDAR_ID');
const API_TOKEN = scriptProperties.getProperty('API_TOKEN'); 

function doPost(e){
  try{
    let jsonString = e.postData.contents;
    jsonString = jsonString.replace(/}\s*{/g, '},{');
    const parsed = JSON.parse(jsonString);

    if (!parsed.token || parsed.token !== API_TOKEN) {
      return ContentService.createTextOutput("Error: Unauthorized");
    }
    const data = parsed.data;

    const mealCal = CalendarApp.getCalendarById(MEAL_CALENDAR_ID);
    if(!mealCal){
      return ContentService.createTextOutput("カレンダーが見つかりません。")
    }

    if(!data || data.length === 0){
      return ContentService.createTextOutput("データが空です。");
    }

    const firstDateStr = data[0].date;
    const lastDateStr = data[data.length-1].date;

    const startDate = parseDateString(firstDateStr);
    const endDate = parseDateString(lastDateStr);
    endDate.setHours(23,59,59,999);

    const existingEvents = mealCal.getEvents(startDate, endDate);
    existingEvents.forEach(event => {
      if (event.getTitle().startsWith('【食事】')){
        event.deleteEvent();
      }
    });

    data.forEach(dayData =>{
      const targetDate = parseDateString(dayData.date);   
      const isLunchNotNeeded = (dayData.lunch === true || String(dayData.lunch).toLowerCase().trim() === "true");
      const isDinnerNotNeeded = (dayData.dinner === true || String(dayData.dinner).toLowerCase().trim() === "true");

      const lunchText = isLunchNotNeeded ? '昼：✕' : '昼：◯';
      const dinnerText = isDinnerNotNeeded ? '夜：✕' : '夜：◯';

      const eventTitle = `【食事】${lunchText} / ${dinnerText}`;

      mealCal.createAllDayEvent(eventTitle, targetDate);

    })

    return ContentService.createTextOutput("Success");
    
  }catch(error){
    return ContentService.createTextOutput("Error: " + error.message);
  }
}

function parseDateString(dateStr){
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10)-1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

function doGet(e) {
  return ContentService.createTextOutput("WEBアプリは正常に起動しています（POSTデータ待ちです）。");
}
