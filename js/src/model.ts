import * as tf from '@tensorflow/tfjs';
import {GraphModel, DataTypeMap, NumericDataType} from '@tensorflow/tfjs';
import {Config} from './config';
import {ContentType} from './contentType';

export class ModelProdiction {

    index: number;
    scores: DataTypeMap[NumericDataType];

}

export class ModelResult {

    score: number;
    label: ContentType;

}

export class ModelResultScores extends ModelResult {

    scores: DataTypeMap[NumericDataType];

}

export class ModelResultLabels extends ModelResult {

    lables: Record<string, number>;

}


export class Model {

    model: GraphModel;

    constructor(public config: Config) {}

    async load(modelURL: string): Promise<void> {
        if (this.model == null) {
            this.model = await tf.loadGraphModel(modelURL);
        };
    }

    predict(features): ModelProdiction {
        const modelInput = tf.tensor([features]);
        const modelOutput = tf.squeeze(this.model.predict(modelInput) as any);
        const maxProbability = tf.argMax(modelOutput);
        const index = maxProbability.dataSync()[0];
        const scores = modelOutput.dataSync();
        maxProbability.dispose();
        modelInput.dispose();
        modelOutput.dispose();
        return {index: index, scores: scores};
    }

    generateResultFromPrediction(prediction: ModelProdiction): ModelResultScores {
        const score = prediction.scores[prediction.index];
        const labelConfig = this.config.labels[prediction.index];
        if (score >= labelConfig.threshold) {
            return {score: score, label: labelConfig.name, scores: prediction.scores};
        }
        if (labelConfig['is_text']) {
            return {score, label: ContentType.GENERIC_TEXT, scores: prediction.scores};
        }
        return {score: score, label: ContentType.UNKNOWN, scores: prediction.scores};
    }

}
