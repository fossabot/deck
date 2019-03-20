import * as React from 'react';

import { IExecution } from 'core/domain';

import './executionStatus.less';
import './executionParameters.less';

export interface IExecutionParametersProps {
  execution: IExecution;
  showingParams: boolean;
  columnFormatAfter: number;
}

export interface IExecutionParametersState {
  parameters: Array<{ key: string; value: any }>;
}

export class ExecutionParameters extends React.Component<IExecutionParametersProps, IExecutionParametersState> {
  constructor(props: IExecutionParametersProps) {
    super(props);

    // these are internal parameters that are not useful to end users
    const strategyExclusions = ['parentPipelineId', 'strategy', 'parentStageId', 'deploymentDetails', 'cloudProvider'];

    let parameters: Array<{ key: string; value: any }> = [];

    const { execution } = this.props;
    if (execution.trigger && execution.trigger.parameters) {
      parameters = Object.keys(execution.trigger.parameters)
        .sort()
        .filter(paramKey => (execution.isStrategy ? !strategyExclusions.includes(paramKey) : true))
        .map((paramKey: string) => {
          return { key: paramKey, value: JSON.stringify(execution.trigger.parameters[paramKey]) };
        });
    }

    this.state = {
      parameters,
    };
  }

  public render() {
    const { showingParams, columnFormatAfter } = this.props;
    const { parameters } = this.state;

    if (!parameters.length || !showingParams) {
      return null;
    }

    let paramsSplitIntoColumns = [parameters];
    if (parameters.length >= columnFormatAfter) {
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
