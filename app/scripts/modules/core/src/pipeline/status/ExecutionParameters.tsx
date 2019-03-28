import * as React from 'react';
import memoize from 'memoize-one';
import filter from 'lodash';

import { IExecution, IPipeline, IParameter } from 'core/domain';
import { Application } from 'core/application/application.model';

import './executionStatus.less';
import './executionParameters.less';
import { ReactInjector } from 'core/reactShims';
import { hydrate } from 'react-dom';
import { pipe } from 'rxjs';
import { isUndefined } from 'util';

export interface IExecutionParametersProps {
  application: Application;
  execution: IExecution;
  showingParams: boolean;
  columnLayoutAfter: number;
  pipelineConfig: IPipeline;
  // handleShowingAllParams: Function;
}

export interface IExecutionParametersState {}

type IDisplayableParameters = Array<{
  key: string;
  value: any;
}>;

export class ExecutionParameters extends React.Component<IExecutionParametersProps, IExecutionParametersState> {
  constructor(props: IExecutionParametersProps) {
    super(props);
  }

  private getDisplayableParameters = memoize((execution: IExecution, pipelineConfig: IPipeline) => {
    // these are internal parameters that are not useful to end users
    const strategyExclusions = ['parentPipelineId', 'strategy', 'parentStageId', 'deploymentDetails', 'cloudProvider'];

    let parameters: IDisplayableParameters;

    const paramConfigOrder: { [key: string]: number } = {};
    pipelineConfig.parameterConfig.forEach((param, index) => {
      paramConfigOrder[param.name] = index;
    });

    if (execution.trigger && execution.trigger.parameters) {
      parameters = Object.keys(execution.trigger.parameters)
        .filter(paramKey => (execution.isStrategy ? !strategyExclusions.includes(paramKey) : true))
        .sort((a, b) => {
          // we'll sort by user provided order
          // if param is not found in pipelineConfig.paramConfig, then we'll fallback to string sort it
          if (isUndefined(paramConfigOrder[a]) && isUndefined(paramConfigOrder[b])) {
            return a < b ? -1 : 1; // string sort missing paramConfigs
          } else if (isUndefined(paramConfigOrder[a])) {
            return 1; // b is found, so a should be moved to the end
          } else if (isUndefined(paramConfigOrder[b])) {
            return -1; // a was found, so b should be moved to the end
          }

          // user defined ordering
          return paramConfigOrder[a] - paramConfigOrder[b];
        })
        .map((paramKey: string) => {
          return { key: paramKey, value: JSON.stringify(execution.trigger.parameters[paramKey]) };
        });
    }

    return parameters;
  });

  public render() {
    const { showingParams, columnLayoutAfter, execution, pipelineConfig } = this.props;

    let parameters = this.getDisplayableParameters(execution, pipelineConfig);

    if (!parameters.length || !showingParams) {
      return null;
    }

    let paramsSplitIntoColumns = [parameters];
    if (parameters.length >= columnLayoutAfter) {
      const halfWay = Math.ceil(parameters.length / 2);
      paramsSplitIntoColumns = [parameters.slice(0, halfWay), parameters.slice(halfWay)];
    }

    return (
      <div className="execution-parameters">
        <h6 className="params-title">Parameters</h6>

        <div className="execution-parameters-container">
          {paramsSplitIntoColumns.map((c, i) => (
            <div key={`execution-params-column-${i}`} className="execution-parameters-column">
              {c.map(p => (
                <div key={p.key} className="an-execution-parameter">
                  <div className="parameter-key">{p.key}:</div>
                  <div className="parameter-value">{p.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
