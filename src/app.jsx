/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

import cockpit from 'cockpit';
import React from 'react';
import {
    Spinner,
    ExpandableSection,
    TextContent,
    Text,
    Divider,
    PageSection,
    Page,
    PageSectionVariants
} from '@patternfly/react-core';
import { Table, TableBody, TableVariant } from '@patternfly/react-table';
import './app.scss';

export class Application extends React.Component {
    constructor() {
        super();
        this.state = {
            isExpanded: false,
            columns: ["Name", "Value"],
            last_update: undefined,
            rows_filter: [
                {
                    heightAuto: true,
                    cells: [
                        {
                            props: { colSpan: 8 },
                            title: (
                                <center><Spinner size="xl" /></center>
                            )
                        }
                    ]
                }
            ],
            rows_unfilter: [
                {
                    heightAuto: true,
                    cells: [
                        {
                            props: { colSpan: 8 },
                            title: (
                                <center><Spinner size="xl" /></center>
                            )
                        }
                    ]
                }
            ]
        };

        this.important = [
            ["Battery Charge", "BCHARGE"],
            ["Time Left", "TIMELEFT"],
            ["Load", "loadpct"],
            ["Battery Voltage", "battv"],
            ["---"],
            ["Status"],
            ["Start Time", "STARTTIME"],
            ["Model"],
            ["Min. Battery Charge", "mbattchg"],
            ["Min. remaining Time", "mintimel"]
        ];

        this.convertArrayToCells = (a) => a.map(e => ({ cells: e }));
        this.handleToggle = (isExpanded) => {
            this.setState({
                isExpanded
            });
        };

        this.tick();
    }

    render() {
        const { columns, rows_filter, rows_unfilter, isExpanded, last_update } = this.state;
        return (
            <Page>
                <PageSection variant={PageSectionVariants.darker}>
                    <TextContent>
                        <Text component="h1">UPS Status</Text>
                        <Text component="p">{last_update ? `last update: ${last_update}` : ""}</Text>
                    </TextContent>
                </PageSection>
                <Divider component="div" />
                <PageSection variant={PageSectionVariants.light}>
                    <Table
                        aria-label="UPS Status Table"
                        variant={TableVariant.compact}
                        borders={false}
                        cells={columns} rows={rows_filter}
                    >
                        <TableBody />
                    </Table>
                    <ExpandableSection
                        toggleText={isExpanded ? "Show Less" : "Show More"}
                        onToggle={this.handleToggle}
                        isExpanded={isExpanded}
                    >
                        <Table
                            aria-label="UPS Status Table"
                            variant={TableVariant.compact}
                            borders={false}
                            cells={columns} rows={rows_unfilter}
                        >
                            <TableBody />
                        </Table>
                    </ExpandableSection>
                </PageSection>
            </Page>
        );
    }

    upsprocess(data) {
        const array_data = data.trim().split("\n")
                .map(e => e.trim().split(/ *: /));
        const filtered = this.important.map(
            e => [e[0], (
                array_data.find(i =>
                    i[0].toLowerCase() == (e[1] ?? e[0]).toLowerCase()
                ) ?? ["", ""]
            )[1]]
        );

        const unused = array_data.filter(e =>
            !(e[0].toLowerCase() in this.important.map(i => (i[1] ?? i[0]).toLowerCase()))
        );

        const last_update = array_data.find(i => i[0] == "DATE")[1];

        this.setState({
            rows_filter: this.convertArrayToCells(filtered),
            rows_unfilter: this.convertArrayToCells(unused),
            last_update
        });
    }

    upserror(exception) {
        console.log(exception);
    }

    tick() {
        cockpit.spawn(["apcaccess", "status"])
                .then(d => this.upsprocess(d))
                .catch(e => this.upserror(e));
    }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), 10000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }
}
