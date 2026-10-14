"""Readable A4 decision report; detailed input records remain in JSON/CSV exports."""

import io
from html import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from backend.app.services.explanation import money
from backend.app.services.client_report import report_content, LABELS
from backend.app.services.formatting import format_number


def pdf_report(result, years):
    out = io.BytesIO()
    view = report_content(result, years)
    p, r = view["project"], view["period"]
    green, pale, ink = map(colors.HexColor, ("#194b3a", "#edf4ef", "#26382f"))
    styles = getSampleStyleSheet()
    styles["Normal"].fontName = "Helvetica"
    styles["Normal"].fontSize = 10
    styles["Normal"].leading = 15
    styles["Normal"].spaceAfter = 9
    styles["Normal"].textColor = ink
    for name in ("Heading1", "Heading2", "Heading3"):
        styles[name].textColor = green
        styles[name].keepWithNext = True
    styles.add(
        ParagraphStyle(
            name="SmallText", fontName="Helvetica", fontSize=8, leading=11, spaceAfter=5, textColor=ink, wordWrap="CJK"
        )
    )
    styles.add(
        ParagraphStyle(
            name="Verdict", fontName="Helvetica-Bold", fontSize=17, leading=23, textColor=green, spaceAfter=12
        )
    )
    story = []

    def plain(value):
        return (
            str(value)
            .translate(
                str.maketrans(
                    {
                        "–": "-",
                        "—": "-",
                        "→": "to",
                        "²": "2",
                        "³": "3",
                        "×": "x",
                        "Σ": "Sum",
                        "−": "-",
                        "’": "'",
                        "“": '"',
                        "”": '"',
                    }
                )
            )
            .encode("latin-1", "replace")
            .decode("latin-1")
        )

    def para(text, style="Normal"):
        return Paragraph(escape(plain(text)), styles[style])

    def add(text, style="Normal"):
        story.append(para(text, style))

    def heading(text):
        story.append(para(text, "Heading2"))

    def make_table(headers, rows, widths, highlight_last=False, marks=None, pad=7):
        data = [[para(x, "SmallText") for x in headers]] + [[para(x, "SmallText") for x in row] for row in rows]
        t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1)
        commands = [
            ("BACKGROUND", (0, 0), (-1, 0), pale),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), pad),
            ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#dce5df")),
        ]
        if highlight_last:
            commands.append(("BACKGROUND", (0, -1), (-1, -1), pale))
        for index in marks or ():
            commands.append(("BACKGROUND", (0, index), (-1, index), pale))
            commands.append(("LINEBEFORE", (0, index), (0, index), 2, green))
        t.setStyle(TableStyle(commands))
        return t

    def table(headers, rows, widths, highlight_last=False, marks=None):
        story.extend([make_table(headers, rows, widths, highlight_last, marks), Spacer(1, 10)])

    def section(title, *blocks):
        """Heading plus its content.

        ReportLab already keeps a heading with the next flowable
        (keepWithNext) and repeats a table's header row when it splits, so
        content flows and pages stay full. Forcing whole tables together pushed
        them onto fresh pages and left large gaps.
        """
        story.append(para(title, "Heading2"))
        story.extend(blocks)
        story.append(Spacer(1, 8))

    def page(title, subtitle):
        if story:
            story.append(PageBreak())
        add(title, "Heading1")
        add(subtitle, "SmallText")
        story.append(Spacer(1, 8))

    page(
        "Your building cost comparison", f"GREENCOST | {years}-year decision report | All amounts in Australian dollars"
    )
    add("Project: " + (p["name"] or "Untitled project"), "Heading2")
    add(view["warning"], "SmallText")
    add(view["verdict"], "Verdict")
    table(
        ["Cost to compare", "Conventional building", "Sustainable building"],
        [
            [
                "Initial building cost",
                money(r["conventional"]["components"]["capital"]),
                money(r["sustainable"]["components"]["capital"]),
            ],
            [
                f"Routine maintenance over {years} years",
                money(r["conventional"]["components"]["maintenance"]),
                money(r["sustainable"]["components"]["maintenance"]),
            ],
            [
                f"TOTAL cost over {years} years",
                money(r["conventional"]["total_lcc"]),
                money(r["sustainable"]["total_lcc"]),
            ],
        ],
        [195, 155, 155],
        True,
    )
    add(
        "The maintenance row is already included in the total. Future bills, repairs, equipment replacements and end-of-period costs are converted to today's equivalent value using your discount rate. These totals are not a sum of future invoices.",
        "SmallText",
    )
    section(
        "What this means for your decision",
        *[para(t) for t in view["findings"]],
        para(
            f"Scope: {p['building_type']} | Postcode {p['postcode']} | {format_number(p['area'] * (0.092903 if p['area_unit'] == 'ft²' else 1))} m2 total floor area | {p['floors']} floor(s).",
            "SmallText",
        ),
    )
    page("Why the costs differ", "Explain the result before reviewing the assumptions.")
    section("Your project explained", *[para(t) for t in view["project_explanation"]])
    if view.get("commentary"):
        section("What this means in practice", *[para(t) for t in view["commentary"]])
    if result.get("measures"):
        section(
            "The upgrades you selected",
            make_table(
                ["Upgrade", "Extra initial cost", "Price basis"],
                [[m["name"] + " - " + m["description"], money(m["premium"]), m["badge"]] for m in view["upgrades"]],
                [240, 125, 140],
            ),
            para(
                "These are installed cost differences against the baseline, including GST. 'Indicative' means an estimate, not a builder's quotation. An already included feature has no additional cost or benefit.",
                "SmallText",
            ),
        )
    else:
        add(
            "No individually priced upgrades were selected."
            if p.get("mode") == "itemised"
            else "This comparison uses a combined research package rather than individually priced upgrades."
        )

    page("Costs and decision checks", "Future costs shown as today's equivalent value.")
    section(
        "Where your money goes",
        make_table(
            [f"Cost over {years} years", "Conventional", "Sustainable"],
            [
                [LABELS.get(k, k), money(v), money(r["sustainable"]["components"][k])]
                for k, v in r["conventional"]["components"].items()
            ],
            [195, 155, 155],
        ),
        para(
            "All future-cost rows show today's equivalent value. Recovered-material value is a credit; a negative figure reduces total cost. Electricity includes supply charges and any modelled solar export credit.",
            "SmallText",
        ),
    )
    payback = view.get("payback")
    if payback:
        # The payback strip and the horizon table are both "how the answer holds
        # up" sections, so they share a page. Splitting them left the horizon
        # table alone on a near-empty page.
        story.append(PageBreak())
        heading("When the sustainable design catches up")
        rows = []
        marks = []
        for i, row in enumerate(payback["rows"]):
            if row["crossover"] or row["reversal"]:
                marks.append(i + 1)
            note = ""
            if row["crossover"]:
                note = " - first year sustainable costs less in total"
            elif row["reversal"]:
                note = " - advantage reverses"
            advantage = row["advantage"]
            label = f"{money(abs(advantage))} {'less' if advantage >= 0 else 'more'}{note}"
            share = f" ({row['advantage_share']:.1f}%)" if row["advantage_share"] is not None else ""
            rows.append(
                [
                    f"Year {row['year']}",
                    money(row["cumulative_conventional"]),
                    money(row["cumulative_sustainable"]),
                    label + share,
                ]
            )
        story.append(
            para(
                "Each row is the running total of every cost up to that year, in today's equivalent value. "
                + (
                    f"The advantage first appears in year {payback['crossover_year']} and is still present at year {years}."
                    if payback["crossover_year"] is not None and not payback["reversal_years"]
                    else f"The advantage first appears in year {payback['crossover_year']} but does not hold for the whole period."
                    if payback["crossover_year"] is not None
                    else f"The sustainable design does not catch up within {years} years."
                ),
                "SmallText",
            )
        )
        story.extend(
            [
                make_table(
                    ["Year", "Conventional to date", "Sustainable to date", "Difference"],
                    rows,
                    [80, 130, 130, 165],
                    marks=marks,
                    pad=5,
                ),
                Spacer(1, 8),
            ]
        )
    section(
        "Could the answer change?",
        para(view["robustness"]),
        make_table(
            ["Study period", "Conventional total", "Sustainable total"],
            [
                [f"{n} years", money(v["conventional"]["total_lcc"]), money(v["sustainable"]["total_lcc"])]
                for n, v in result["periods"].items()
            ],
            [195, 155, 155],
        ),
    )
    if result.get("budget_scenarios"):
        section(
            "Your construction budget range",
            make_table(
                ["Budget case", "Conventional total", "Sustainable total"],
                [
                    [label.title(), money(v[str(years)]["conventional"]), money(v[str(years)]["sustainable"])]
                    for label, v in result["budget_scenarios"].items()
                ],
                [195, 155, 155],
            ),
        )
    # The assumption record is the last content page, so it gets its own page
    # rather than being split across the horizon table's page. That keeps the
    # input table and the replacement schedule whole and fills the page.
    page("Your assumptions and next steps", "Check the inputs that could change the decision.")
    section(
        "Your key inputs",
        make_table(["Input", "Value / explanation"], view["inputs"], [190, 315]),
        para("End-of-period plan: " + p.get("terminal_basis", "Review your end-of-period assumptions."), "SmallText"),
    )
    replacements = view.get("replacements")
    if replacements:
        repl_rows = [
            [
                str(item["year"]),
                item["name"],
                "Both designs" if item["scenario"] == "conventional" else "Sustainable",
                money(item["cost"]),
            ]
            for item in replacements["items"][:14]
        ]
        if len(replacements["items"]) > 14:
            repl_rows.append(["...", f"{len(replacements['items']) - 14} further events", "", ""])
        noted = (
            f"Equipment is replaced on its own service interval, so the same item is charged more than once. "
            f"{replacements['occurrences']} replacement event(s) fall between year {replacements['first_year']} and year {replacements['last_year']}; "
            "each is already included in the totals, and none is added at the final year."
        )
        section(
            "Planned equipment replacements",
            para(noted, "SmallText"),
            make_table(
                ["Year", "Item", "Applies to", "Today's cost"],
                repl_rows,
                [55, 215, 115, 120],
                pad=5,
            ),
        )
    if result.get("budget_scenarios"):
        add(
            "A budget range was entered. Headline figures use the midpoint; low and high budgets are alternative starting-cost scenarios.",
            "SmallText",
        )
    notes = [f"{i}. {text}" for i, text in enumerate(view["next_steps"], 1)]
    if p["building_type"] == "Apartment Building":
        notes.append(
            "Whole apartment building: include all relevant apartments, lifts, car parks, central plant, fire systems and common services in costs. The generic model does not automatically price these systems. Occupancy is a planning estimate, not a permitted capacity."
        )
    section("Before committing to the design", *[para(t, "SmallText") for t in notes])

    page(
        "Evidence and report notes",
        "Sources support the assumptions; they are not a guarantee of your project's performance.",
    )
    references = [
        KeepTogether(
            [
                para(source["organisation"] + " - " + source["title"], "Heading3"),
                para(source["url"], "SmallText"),
                para(
                    f"Reference period: {source.get('effective_from', 'not recorded')} to {source.get('effective_to') or 'not specified'}. Checked: {source.get('retrieved_at', 'not recorded')}.",
                    "SmallText",
                ),
            ]
        )
        for source in result.get("sources", [])
    ]
    section("Utility and cost references", *references)
    evidence = result.get("evidence", [])[:8]
    research = []
    for i, e in enumerate(evidence, 1):
        location = f"page {e['page']}" if e.get("page") else "web reference"
        kind = "Included project research" if e.get("source_type") == "PROJECT_RESEARCH" else "Research / web context"
        research.append(para(f"[S{i}] {e['source']} - {location}. {kind}.", "SmallText"))
        if e.get("url"):
            research.append(para(e["url"], "SmallText"))
    section(
        "Supporting research",
        *(research or [para("No research references were retained for this comparison.", "SmallText")]),
    )
    section(
        "What this report can and cannot tell you",
        para(
            "This is a financial comparison of the entered scenarios. It does not certify BASIX, NatHERS, structural design or building compliance. Sustainability features may offer comfort or environmental benefits that this cost calculation does not measure.",
            "SmallText",
        ),
        para(
            "Research assumptions and generic building quantities need project confirmation. Demonstration values and indicative prices must be replaced with applicable bills, plans and installed quotes. Higher cost for the sustainable option is a valid result.",
            "SmallText",
        ),
        para(
            "For a complete input record, save your project JSON. For each year's costs, download the cash-flow CSV. Those files retain the technical detail without filling this client report with raw data.",
            "SmallText",
        ),
        para(
            f"Price reference: {result.get('price_snapshot_date') or p['price_date']} | Assumption set: {result.get('assumption_version', 'not recorded')}.",
            "SmallText",
        ),
    )

    def footer(canvas, doc):
        canvas.setStrokeColor(colors.HexColor("#dce5df"))
        canvas.line(45, 39, A4[0] - 45, 39)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(green)
        canvas.drawString(45, 25, "GreenCost | Planning estimate | AUD")
        canvas.drawRightString(A4[0] - 45, 25, f"Page {doc.page}")

    SimpleDocTemplate(
        out,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=52,
        title=plain((p["name"] or "Untitled project") + " - GreenCost decision report"),
        author="GreenCost",
    ).build(story, onFirstPage=footer, onLaterPages=footer)
    return out.getvalue()
