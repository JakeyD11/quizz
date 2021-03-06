import { getSession } from 'next-auth/react';
import { randomize } from '../../../helpers/general-util';
import Question from '../../../models/Question';
import Quiz from '../../../models/Quiz';

export default async function useHandler(req, res) {
    const session = await getSession({ req });
    const { questionId } = req.query;
    const { method } = req;

    if (!session?.user) {
        return res.status(403).json({
            status: 'fail',
            message: 'Please sign in to use this route.',
        });
    }

    if (!questionId) {
        throw new Error('You must provide a valid id');
    }

    let question = {},
        quiz;
    switch (method) {
        case 'PATCH':
            question = await Question.findById(questionId);
            if (!question) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'No question found with that id.',
                });
            }

            quiz = await Quiz.findById(question.quizId);
            if (!quiz) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'No quiz associated with this question.',
                });
            }

            if (!quiz.creator.equals(session.user.id)) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You do not have permission to do that.',
                });
            }

            let answers = randomize(Object.values(req.body.answers));
            let correctAnswer = answers.findIndex(
                x => x === req.body.answers.correct
            );
            question.content = req.body.question;
            question.answers = answers;
            question.correctAnswer = correctAnswer;

            await question.save();

            return res.status(200).json({
                status: 'success',
                message: 'successfully updated question',
            });
        case 'DELETE':
            question = await Question.findById(questionId);
            if (!question) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'No question found with that id.',
                });
            }

            quiz = await Quiz.findById(question.quizId);
            if (!quiz) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'No quiz associated with this question.',
                });
            }

            if (quiz.creator !== session.user.id) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You do not have permission to do that.',
                });
            }

            await question.remove();

            return res.status(200).json({
                status: 'success',
                message: 'successfully deleted question',
            });
        default:
            res.setHeader('Allow', ['PATCH', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}