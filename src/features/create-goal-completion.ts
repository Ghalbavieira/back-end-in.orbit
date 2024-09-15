import { goalCompletions, goals } from "../db/schema";
import { and, count, gte, lte, sql, eq } from "drizzle-orm"
import { db } from "../db"
import dayjs from "dayjs";
import { noSSR } from "next/dynamic";


interface CreateGoalCompletionRequest{
    goalId: string
}

export async function createGoalCompletion({
    goalId 
 }:CreateGoalCompletionRequest) {
    const firstDayWeek = dayjs().startOf('week').toDate();
    const lastDayWeek = dayjs().endOf('week').toDate();
    
    const goalCompletionCounts = db.$with('goal_completion_counts').as(
        db.select({
            goalId: goalCompletions.goalId,
            completionCount: count(goalCompletions.id).as('completionCount'),
        })
        .from(goalCompletions)
        .where(
            and(
                gte(goalCompletions.createdAt, firstDayWeek),
                lte(goalCompletions.createdAt, lastDayWeek),
                eq(goalCompletions.goalId, goalId),
            )
        )
        .groupBy(goalCompletions.goalId)
    )


    const result = await db
    .with(goalCompletionCounts)
    .select({
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        completionCount: sql/*sql*/`
            COALESCE(${goalCompletionCounts.completionCount}, 0)
        `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, 
        eq(goalCompletionCounts.goalId, goals.id))

    const { completionCount, desiredWeeklyFrequency } = result[0]
        if(completionCount >= desiredWeeklyFrequency){
            throw new Error('Goal already completed this week!');
        }
    
    const insertResults = await db.insert(goalCompletions).values({goalId}).returning()
    const goalCompletion = insertResults[0]

    return goalCompletion
}