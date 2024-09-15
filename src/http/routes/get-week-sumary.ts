import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getWeekPendingGoals } from "../../features/get-week-pending-goals";
import { getWeekSummary } from "../../features/get-week-sumary";


export const getWeekSummaryRoute: FastifyPluginAsyncZod = async (app) => {
    app.get('/summary', async () =>{
        const { summary } = await getWeekSummary()
    
        return { summary }
    })
    
}