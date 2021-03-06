
import { finnHubDataObj } from '../../../../widgets/Estimates/EarningsCalendar/EarningsCalendarBody'

export default function recommendationTrendsGQLFilter(data: finnHubDataObj, config: Object = {}) {
    //convert time series list to Object: Keys = period, values = object
    const resObj = {}
    const earningsCalendar = data.earningsCalendar
    for (const d in earningsCalendar) {
        const key = earningsCalendar[d].date
        const val = earningsCalendar[d]
        resObj[key] = val
    }
    return resObj
}