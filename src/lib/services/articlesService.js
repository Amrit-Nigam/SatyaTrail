// Deterministic seed data for articles
const articles = [
  {
    id: "art_001",
    headline: "Government announces new urban transport policy",
    subheadline: "Policy aims to reduce congestion in major metros by 2030.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Riya Mehta",
    publishedAt: "2025-11-20T09:00:00.000Z",
    category: "Policy",
    body: `The government has unveiled an ambitious new urban transport policy that promises to transform how citizens commute in major metropolitan areas. The comprehensive plan, announced at a press conference this morning, sets aggressive targets for reducing traffic congestion by up to 40% by 2030.

Key initiatives include the expansion of metro rail networks in eight major cities, introduction of electric bus fleets, and the creation of dedicated cycling lanes spanning over 500 kilometers. The policy also emphasizes last-mile connectivity solutions and integration of various transport modes through a unified digital platform.

"This is a paradigm shift in how we approach urban mobility," said the Transport Minister. "We're not just building infrastructure; we're reimagining the entire ecosystem of urban transportation."

Industry experts have largely welcomed the announcement, though some have raised concerns about the ambitious timeline. Environmental groups praised the focus on sustainable transport options, particularly the commitment to phasing out diesel-powered public buses within five years.

The implementation will be rolled out in phases, with pilot programs launching in three cities by early 2026. Funding for the initiative will come from a combination of government allocations, public-private partnerships, and green bonds.`,
    imageUrl: "/mock-images/articles/transport.jpg",
    newsNodeId: "node_001",
    verdict: "likely_true",
    confidence: 0.83
  },
  {
    id: "art_002",
    headline: "Viral video claims subway tunnel has collapsed",
    subheadline: "Clips circulating on social media show dramatic scenes.",
    sourceId: "src_02",
    sourceName: "MetroBuzz",
    author: "Staff Reporter",
    publishedAt: "2025-11-21T18:30:00.000Z",
    category: "Breaking",
    body: `A video claiming to show a dramatic subway tunnel collapse has gone viral on social media platforms, accumulating millions of views within hours. The footage, which appears to show debris falling and panicked commuters, has sparked widespread concern and confusion.

However, authorities have been quick to respond to the viral content. The Metro Rail Corporation issued an official statement categorically denying any such incident. "All our tunnel structures are intact and operations are running normally," the statement read.

Upon investigation, fact-checkers have determined that the video actually shows footage from an incident in another country that occurred several years ago. The original incident, which took place in a different continent, has been misleadingly repurposed and presented as a current local event.

Social media platforms have begun flagging the content as potentially misleading, though the video continues to spread rapidly through private messaging channels. Experts warn about the dangers of sharing unverified content, especially during emergencies.

Local authorities urge citizens to rely on official channels for information and to verify news before sharing.`,
    imageUrl: "/mock-images/articles/tunnel.jpg",
    newsNodeId: "node_002",
    verdict: "likely_false",
    confidence: 0.9
  },
  {
    id: "art_003",
    headline: "Tech startup raises $50M for AI-powered healthcare",
    subheadline: "Revolutionary diagnostic tool promises early disease detection.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Arjun Sharma",
    publishedAt: "2025-11-19T14:15:00.000Z",
    category: "Technology",
    body: `HealthMind Technologies, a promising startup focused on artificial intelligence applications in healthcare, has successfully closed a $50 million Series B funding round. The investment was led by prominent venture capital firm Future Ventures, with participation from several healthcare-focused institutional investors.

The company's flagship product is an AI-powered diagnostic assistant that analyzes medical imaging data to detect early signs of various diseases, including certain types of cancer and cardiovascular conditions. Clinical trials have shown promising results, with the system achieving accuracy rates comparable to experienced radiologists.

"Our mission is to democratize access to high-quality diagnostic capabilities," said the company's CEO. "This funding will allow us to scale our operations and bring our technology to healthcare providers across the country."

The startup plans to use the funds to expand its engineering team, conduct additional clinical validations, and obtain necessary regulatory approvals. The company is also exploring partnerships with major hospital chains and diagnostic centers.

Healthcare industry analysts view this as part of a broader trend of increased investment in AI-driven medical technologies, a sector that has seen exponential growth following recent advances in machine learning capabilities.`,
    imageUrl: "/mock-images/articles/healthcare.jpg",
    newsNodeId: "node_003",
    verdict: "likely_true",
    confidence: 0.78
  },
  {
    id: "art_004",
    headline: "Celebrity endorsement of miracle weight loss pill under scrutiny",
    subheadline: "Health authorities warn against unverified claims.",
    sourceId: "src_04",
    sourceName: "ViralClipsChannel",
    author: "Anonymous",
    publishedAt: "2025-11-22T08:00:00.000Z",
    category: "Health",
    body: `A viral social media campaign featuring a well-known celebrity endorsing a "miracle weight loss pill" has drawn the attention of health regulators. The promotional content, which claims the product can help users lose significant weight without diet or exercise, has been viewed millions of times.

Health authorities have issued warnings about the product, noting that its claims have not been verified by any regulatory body. The Food and Drug Administration stated that no such approval exists for the product in question.

Medical professionals have expressed concern about the potential risks of unregulated supplements. "Products that promise dramatic results without lifestyle changes are typically too good to be true," said Dr. Priya Nair, a nutrition specialist. "Some of these supplements may contain undisclosed ingredients that could be harmful."

The celebrity's representatives have not responded to requests for comment. Consumer protection agencies are advising the public to be skeptical of health claims made through social media endorsements and to consult healthcare professionals before using any new supplements.

Investigations are ongoing to determine whether the promotional content violates advertising standards and consumer protection laws.`,
    imageUrl: "/mock-images/articles/health.jpg",
    newsNodeId: "node_004",
    verdict: "likely_false",
    confidence: 0.85
  },
  {
    id: "art_005",
    headline: "Historic peace agreement signed after decade-long conflict",
    subheadline: "International community welcomes breakthrough negotiations.",
    sourceId: "src_03",
    sourceName: "Press Bureau",
    author: "Official Correspondent",
    publishedAt: "2025-11-18T16:45:00.000Z",
    category: "World",
    body: `In a historic development, representatives from two long-standing adversaries have signed a comprehensive peace agreement, marking the potential end of a conflict that has lasted over a decade. The signing ceremony took place at a neutral venue, with dignitaries from multiple nations in attendance.

The agreement includes provisions for a permanent ceasefire, exchange of prisoners, establishment of humanitarian corridors, and a framework for political dialogue. Both parties have committed to implementing the terms within a specified timeframe, with international observers monitoring compliance.

"Today marks a new chapter in our history," said the lead negotiator. "We have chosen the path of peace over the continuation of suffering."

The international community has broadly welcomed the agreement. The United Nations Secretary-General called it "a triumph of diplomacy and human spirit." Major world powers have pledged support for the implementation process, including potential economic assistance for reconstruction efforts.

However, analysts caution that significant challenges remain in translating the agreement into lasting peace. Previous ceasefire attempts have failed, and deep-seated grievances on both sides will require sustained effort to address.

Civil society organizations are hopeful but watchful, emphasizing the importance of inclusive implementation that addresses the needs of affected communities.`,
    imageUrl: "/mock-images/articles/peace.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.92
  },
  {
    id: "art_006",
    headline: "Major bank announces unexpected interest rate changes",
    subheadline: "Economists debate implications for housing market.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Finance Desk",
    publishedAt: "2025-11-21T11:30:00.000Z",
    category: "Finance",
    body: `One of the country's largest banks has announced a surprise adjustment to its lending rates, a move that has caught many market observers off guard. The changes, effective immediately, will impact mortgage rates, personal loans, and business credit facilities.

The decision comes amid mixed signals about the broader economic outlook. While inflation has shown signs of moderating, concerns about global economic headwinds have added uncertainty to financial markets.

"This adjustment reflects our assessment of current market conditions and our commitment to maintaining a balanced portfolio," said the bank's Chief Financial Officer in a statement.

Real estate industry stakeholders are closely watching how the changes might affect the housing market. Some analysts suggest the rate adjustments could cool demand in already-slowing segments, while others believe the impact will be limited given other economic factors at play.

Consumer advocacy groups have urged borrowers to carefully review their existing loan terms and consider whether refinancing options might be beneficial. Financial advisors recommend that those with variable-rate loans pay particular attention to potential changes in their monthly obligations.

The central bank has not commented on the individual institution's decision, though market watchers are looking for signals about potential policy adjustments in the coming months.`,
    imageUrl: "/mock-images/articles/finance.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.75
  },
  {
    id: "art_007",
    headline: "Rare astronomical event visible tonight across hemisphere",
    subheadline: "Scientists say it won't occur again for another 200 years.",
    sourceId: "src_03",
    sourceName: "Press Bureau",
    author: "Science Correspondent",
    publishedAt: "2025-11-22T06:00:00.000Z",
    category: "Science",
    body: `Stargazers and astronomy enthusiasts are in for a treat as a rare celestial event will be visible in night skies across the hemisphere tonight. The phenomenon, a conjunction of three planets aligned in an unusually close formation, occurs only once every two centuries.

Astronomers have confirmed that the event will be visible to the naked eye under clear sky conditions, though those with telescopes or binoculars will enjoy more detailed views. The optimal viewing window is expected to be between 9 PM and midnight local time.

"This is a once-in-a-lifetime opportunity," said Dr. Kavita Rao, director of the National Observatory. "The last time this alignment occurred was in 1823, and it won't happen again until 2225."

Science institutions across the country are organizing public viewing events, with many observatories extending their hours to accommodate visitors. Educational programs are also being conducted to help people understand the astronomical mechanics behind the event.

Weather forecasts suggest that most regions will have favorable viewing conditions, though some areas may experience cloud cover. Enthusiasts are advised to find locations away from city lights for the best experience.

Social media has been buzzing with anticipation, with hashtags related to the event trending globally. Photographers are preparing to capture what promises to be a visually stunning phenomenon.`,
    imageUrl: "/mock-images/articles/astronomy.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.88
  },
  {
    id: "art_008",
    headline: "Controversial study claims coffee consumption linked to longevity",
    subheadline: "Findings spark debate among nutrition experts.",
    sourceId: "src_02",
    sourceName: "MetroBuzz",
    author: "Health Reporter",
    publishedAt: "2025-11-20T13:45:00.000Z",
    category: "Health",
    body: `A newly published study has reignited the debate about coffee's health effects, with researchers claiming to have found a significant correlation between moderate coffee consumption and increased lifespan. The study, conducted over a 15-year period with thousands of participants, suggests that those who drink 3-4 cups of coffee daily may have a lower risk of certain age-related conditions.

However, the findings have been met with skepticism from some quarters of the scientific community. Critics point out methodological limitations, including potential confounding factors that the study may not have adequately controlled for.

"Correlation does not imply causation," cautioned Dr. Raj Patel, a nutrition researcher not involved in the study. "People who drink moderate amounts of coffee may share other lifestyle characteristics that contribute to longevity."

The study authors have defended their methodology, noting that they controlled for variables such as diet, exercise, and smoking habits. They acknowledge, however, that further research is needed to understand the potential mechanisms behind their observations.

Coffee industry groups have welcomed the findings, though health authorities advise against making dietary changes based on a single study. Consumers are encouraged to consider their overall lifestyle and consult healthcare providers about their specific circumstances.

The study has been published in a peer-reviewed journal and is expected to stimulate further research into coffee's potential health effects.`,
    imageUrl: "/mock-images/articles/coffee.jpg",
    newsNodeId: null,
    verdict: "mixed",
    confidence: 0.55
  },
  {
    id: "art_009",
    headline: "Local artist's mural sparks community conversation",
    subheadline: "Public art project addresses environmental themes.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Arts & Culture Desk",
    publishedAt: "2025-11-19T09:30:00.000Z",
    category: "Culture",
    body: `A striking new mural adorning the side of a downtown building has become the talk of the community, sparking conversations about art, public spaces, and environmental awareness. Created by local artist Maya Chen over the course of three weeks, the large-scale work depicts a vibrant ecosystem transitioning into industrial landscapes.

"I wanted to create something that would make people stop and think about our relationship with nature," Chen explained during the mural's unveiling. "Art has the power to start conversations that statistics and reports sometimes can't."

The mural was commissioned by the city's arts council as part of a broader initiative to bring more public art to urban spaces. Funding came from a combination of municipal grants and private donations.

Reactions from community members have been largely positive, with many praising the technical skill and thought-provoking imagery. Local schools have incorporated visits to the mural into their environmental education programs.

However, some residents have raised questions about the selection process for public art projects and called for more community input in future decisions. The arts council has indicated it will review its public engagement processes in response to the feedback.

The mural joins a growing collection of public artworks across the city, part of an effort to enhance urban aesthetics and support local artists.`,
    imageUrl: "/mock-images/articles/mural.jpg",
    newsNodeId: null,
    verdict: "unchecked",
    confidence: 0
  },
  {
    id: "art_010",
    headline: "New study reveals alarming levels of microplastics in drinking water",
    subheadline: "Researchers call for urgent policy action.",
    sourceId: "src_03",
    sourceName: "Press Bureau",
    author: "Environment Correspondent",
    publishedAt: "2025-11-21T08:00:00.000Z",
    category: "Environment",
    body: `A comprehensive study by environmental researchers has revealed concerning levels of microplastic contamination in drinking water sources across multiple regions. The findings, based on samples collected from both treated municipal supplies and bottled water, indicate that the issue is more widespread than previously estimated.

According to the research, an average person may be ingesting thousands of microplastic particles weekly through water consumption alone, not accounting for other sources such as food and air.

"The implications of this contamination for human health are still being studied, but the sheer prevalence is cause for concern," said the study's lead researcher. "We need to fundamentally rethink our relationship with plastic."

Health authorities have noted that while the long-term health effects of microplastic ingestion remain unclear, precautionary measures are warranted. Recommendations include using filtered water, reducing single-use plastic consumption, and supporting policies aimed at plastic reduction.

Environmental groups have called for stricter regulations on plastic production and disposal, as well as increased investment in water treatment technologies capable of filtering out microplastics.

The study has prompted several municipalities to announce reviews of their water treatment processes. Industry representatives have expressed willingness to collaborate on solutions while noting the complexity of the challenges involved.`,
    imageUrl: "/mock-images/articles/water.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.82
  },
  {
    id: "art_011",
    headline: "Rumors of major tech company layoffs prove unfounded",
    subheadline: "Company confirms business as usual after stock dip.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Tech Correspondent",
    publishedAt: "2025-11-22T10:15:00.000Z",
    category: "Technology",
    body: `Speculation about mass layoffs at a major technology company that sent its stock tumbling has been firmly denied by company leadership. The rumors, which originated from an anonymous social media post, suggested that up to 30% of the workforce could be affected.

In a statement issued this morning, the company's CEO addressed the speculation directly: "These rumors are completely unfounded. We have no plans for large-scale layoffs, and our business fundamentals remain strong."

The company also announced that it would be pursuing legal action against the original source of the misinformation, citing potential market manipulation and damage to its reputation.

Stock prices, which had dropped nearly 8% in pre-market trading on the rumors, recovered most of their losses following the official denial. Market analysts noted that the incident highlights the vulnerability of even large corporations to unverified information in the age of social media.

"This is a textbook case of how misinformation can move markets," said financial analyst Deepak Srivastava. "Investors and the public need to be increasingly discerning about the sources they trust."

The incident has reignited discussions about the responsibility of social media platforms in preventing the spread of market-moving misinformation.`,
    imageUrl: "/mock-images/articles/tech.jpg",
    newsNodeId: null,
    verdict: "unclear",
    confidence: 0.45
  },
  {
    id: "art_012",
    headline: "Local schools adopt innovative mental health programs",
    subheadline: "Initiative aims to support student wellbeing.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Education Reporter",
    publishedAt: "2025-11-18T14:00:00.000Z",
    category: "Education",
    body: `School districts across the region are implementing comprehensive mental health support programs in response to growing concerns about student wellbeing. The initiatives, developed in consultation with mental health professionals and educators, aim to provide students with resources and skills for managing stress, anxiety, and other challenges.

The programs include regular counseling sessions, peer support networks, mindfulness training, and digital tools that allow students to check in about their emotional state. Teachers are also receiving training to identify signs of distress and provide appropriate support.

"We've seen a significant increase in mental health challenges among young people, exacerbated by recent global events," said the district's superintendent. "These programs are an investment in our students' overall success."

Early feedback from pilot schools has been positive, with both students and parents reporting increased awareness and comfort in discussing mental health topics. Some teachers have noted improvements in classroom dynamics and student engagement.

Funding for the programs comes from a combination of federal grants, state education budgets, and community donations. Mental health advocacy organizations have praised the initiatives while calling for similar approaches to be adopted nationwide.

The programs are part of a broader trend toward recognizing mental health as an integral component of education, alongside academic achievement.`,
    imageUrl: "/mock-images/articles/education.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.79
  },
  {
    id: "art_013",
    headline: "Crypto exchange faces regulatory investigation",
    subheadline: "Users report difficulties withdrawing funds.",
    sourceId: "src_02",
    sourceName: "MetroBuzz",
    author: "Finance Reporter",
    publishedAt: "2025-11-22T15:30:00.000Z",
    category: "Finance",
    body: `A prominent cryptocurrency exchange is under investigation by financial regulators amid mounting complaints from users unable to withdraw their funds. The exchange, which had positioned itself as a secure and compliant platform, has seen a surge in customer service requests and social media complaints over the past week.

Regulatory authorities have confirmed that they are looking into the matter but declined to provide details about the scope of their investigation. The exchange's management has attributed the withdrawal delays to "technical difficulties" and promised resolution within days.

However, some users report that their withdrawal requests have been pending for weeks, raising concerns about the platform's solvency. Industry observers note that such delays have historically preceded the collapse of other cryptocurrency platforms.

"Users should be cautious and avoid keeping large amounts of cryptocurrency on any exchange," advised crypto analyst Nisha Kumar. "The mantra 'not your keys, not your coins' exists for a reason."

The exchange has not responded to specific questions about its financial health or the number of affected users. Its native token has lost significant value as uncertainty mounts.

Consumer protection agencies are advising affected users to document their communications with the platform and consider reporting their experiences to relevant authorities.`,
    imageUrl: "/mock-images/articles/crypto.jpg",
    newsNodeId: null,
    verdict: "mixed",
    confidence: 0.6
  },
  {
    id: "art_014",
    headline: "Historic building renovation uncovers archaeological finds",
    subheadline: "Discoveries shed light on city's ancient history.",
    sourceId: "src_03",
    sourceName: "Press Bureau",
    author: "Heritage Correspondent",
    publishedAt: "2025-11-17T11:00:00.000Z",
    category: "Culture",
    body: `Renovation work on a centuries-old building in the city center has unexpectedly unearthed a trove of archaeological artifacts, providing new insights into the area's ancient history. Construction workers made the initial discovery when preparing the foundation for structural reinforcement.

Archaeologists called to the site have identified pottery, coins, and structural remnants dating back several centuries. Preliminary analysis suggests the area may have been a bustling marketplace in ancient times, contradicting previous assumptions about the city's historical layout.

"This is a remarkable find that rewrites part of our understanding of this city's past," said Dr. Arun Nair, the lead archaeologist on the project. "The artifacts tell stories of trade, culture, and daily life that textbooks don't capture."

The renovation project has been temporarily paused to allow for proper archaeological documentation. City authorities are working with the building owners and heritage organizations to determine the best path forward that balances preservation with development needs.

Some artifacts will eventually be displayed at the city museum, with detailed documentation being prepared for academic publication. Virtual reality reconstructions of the historical site are also being planned to allow public engagement with the discoveries.

Heritage advocates are calling for the site to be designated as a protected area, though the implications for the ongoing renovation remain unclear.`,
    imageUrl: "/mock-images/articles/archaeology.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.87
  },
  {
    id: "art_015",
    headline: "Electric vehicle sales surge as new models hit market",
    subheadline: "Industry analysts predict continued growth trajectory.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Auto Industry Reporter",
    publishedAt: "2025-11-20T16:20:00.000Z",
    category: "Technology",
    body: `Electric vehicle sales have reached new highs as several major manufacturers launched competitive new models with improved range, faster charging, and more accessible price points. Industry data shows that EV sales in the past quarter exceeded projections by a significant margin.

The growth is attributed to multiple factors, including government incentives, expanding charging infrastructure, declining battery costs, and increasing consumer awareness of environmental issues. New models from both established automakers and emerging EV-focused companies are offering consumers more choices than ever before.

"We're seeing a tipping point where EVs are becoming the practical choice for mainstream consumers, not just early adopters," said automotive analyst Priya Venkat. "The economics increasingly favor electric."

Charging infrastructure providers are racing to keep pace with growing demand, with thousands of new charging stations being installed monthly. Some regions are now reaching the density of charging points that makes EV ownership convenient even for apartment dwellers without home charging options.

However, challenges remain, including supply chain constraints for key battery materials, grid capacity concerns in some areas, and the need for more affordable entry-level EV options. Traditional automakers continue to grapple with the transition away from internal combustion engines while protecting existing revenue streams.

Industry forecasts suggest that EVs could account for a majority of new car sales within the next decade.`,
    imageUrl: "/mock-images/articles/ev.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.81
  },
  {
    id: "art_016",
    headline: "Viral claim about vaccine side effects debunked by health authorities",
    subheadline: "Misinformation continues to spread despite official denials.",
    sourceId: "src_03",
    sourceName: "Press Bureau",
    author: "Health Correspondent",
    publishedAt: "2025-11-21T14:00:00.000Z",
    category: "Health",
    body: `Health authorities have issued a strong rebuttal to viral claims circulating on social media about alleged severe side effects from routine vaccinations. The claims, which have been shared millions of times, cite fabricated studies and misrepresent actual medical data.

"The claims being circulated are not supported by any credible scientific evidence," stated the Health Ministry in an official communication. "Vaccines undergo rigorous testing and continuous monitoring to ensure their safety."

Medical experts have pointed out numerous factual errors in the viral posts, including misidentified medications, fabricated statistics, and misattributed quotes. Some of the imagery accompanying the posts has been traced to unrelated medical conditions or stock photos.

Despite official debunking efforts, the misinformation continues to spread, particularly through private messaging groups where content moderation is difficult. Public health officials are concerned that such claims could undermine vaccination efforts and put communities at risk.

"Misinformation about vaccines can have real-world consequences," said Dr. Meera Sharma, an epidemiologist. "When people make healthcare decisions based on false information, it's not just their health at stake, but community health as well."

Health authorities are working with social media platforms to flag and reduce the visibility of such content, while also running public awareness campaigns to help people identify and resist health misinformation.`,
    imageUrl: "/mock-images/articles/vaccine.jpg",
    newsNodeId: null,
    verdict: "likely_false",
    confidence: 0.93
  },
  {
    id: "art_017",
    headline: "International sports event brings economic boost to host city",
    subheadline: "Tourism and local businesses see significant uptick.",
    sourceId: "src_01",
    sourceName: "City Herald",
    author: "Sports & Economy Desk",
    publishedAt: "2025-11-19T18:00:00.000Z",
    category: "Sports",
    body: `The host city for the ongoing international sports competition is experiencing a significant economic boost, with hotels, restaurants, and local businesses reporting brisk activity. Early estimates suggest the event could contribute substantially to the local economy.

Hotels across the city are reporting near-full occupancy, with some visitors forced to seek accommodation in neighboring areas. Restaurants and entertainment venues are seeing their busiest period in years, with many hiring additional staff to cope with demand.

"This event has been a game-changer for our business," said a local restaurant owner. "We've seen customers from dozens of countries in the past week alone."

Transportation services, including taxis, ride-shares, and public transit, have also seen increased usage. Local artisans and souvenir vendors report strong sales of event-related merchandise and local crafts.

City officials had invested heavily in infrastructure improvements ahead of the event, including upgrades to stadiums, transportation networks, and public spaces. While some residents initially expressed concerns about disruption, sentiment has shifted as the economic benefits become apparent.

Tourism authorities are hoping that the positive exposure will translate into sustained interest in the city as a destination beyond the event period. Post-event surveys and economic analyses are being planned to assess the full impact.

The competition continues through the weekend, with several high-profile matches expected to draw additional visitors.`,
    imageUrl: "/mock-images/articles/sports.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.76
  },
  {
    id: "art_018",
    headline: "Mystery illness outbreak in remote village remains unexplained",
    subheadline: "Health teams deployed as investigations continue.",
    sourceId: "src_02",
    sourceName: "MetroBuzz",
    author: "Health Reporter",
    publishedAt: "2025-11-22T12:00:00.000Z",
    category: "Health",
    body: `Health authorities are investigating a cluster of unexplained illness cases in a remote village, with symptoms including fever, fatigue, and respiratory issues. Medical teams have been deployed to the area, and affected individuals are receiving treatment at local facilities.

Initial tests have ruled out several common infectious diseases, and investigators are exploring environmental factors, contaminated water sources, and other potential causes. Laboratory analysis of samples is ongoing.

"We are taking this situation very seriously and are committed to identifying the cause as quickly as possible," said the district health officer. "In the meantime, we are providing supportive care to affected individuals and monitoring for any new cases."

Local residents have expressed anxiety about the situation, with some choosing to temporarily relocate to nearby towns. Social media speculation has generated various unsubstantiated theories about the cause, which officials are working to address through regular updates.

The village, located in a relatively isolated area with limited healthcare infrastructure, presents logistical challenges for investigation teams. Additional resources and specialists are being brought in to support the response effort.

Public health protocols have been implemented, including enhanced surveillance in surrounding areas. Authorities emphasize that there is currently no evidence to suggest the illness is highly contagious or spreading beyond the initial cluster.`,
    imageUrl: "/mock-images/articles/illness.jpg",
    newsNodeId: null,
    verdict: "unclear",
    confidence: 0.4
  },
  {
    id: "art_019",
    headline: "New renewable energy project promises thousands of jobs",
    subheadline: "Wind farm development receives final regulatory approval.",
    sourceId: "src_03",
    sourceName: "Press Bureau",
    author: "Energy Correspondent",
    publishedAt: "2025-11-18T09:30:00.000Z",
    category: "Environment",
    body: `A major renewable energy project has received final regulatory approval, paving the way for construction of one of the region's largest wind farms. The development is expected to create thousands of jobs during construction and hundreds of permanent positions for ongoing operations.

The project, spanning several thousand acres, will feature state-of-the-art wind turbines capable of generating enough electricity to power hundreds of thousands of homes. The energy produced will be fed into the national grid, contributing to the country's renewable energy targets.

"This project represents a significant step toward our clean energy future," said the Energy Minister at the approval announcement. "It demonstrates that economic development and environmental responsibility can go hand in hand."

Local communities have expressed mixed reactions. While the economic opportunities are welcomed, some residents have raised concerns about visual impact, noise, and effects on local wildlife. The project developers have committed to mitigation measures and ongoing community engagement.

Environmental groups have largely supported the project while calling for continued attention to ecological considerations during construction. Wildlife surveys and habitat assessments have been incorporated into the project plan.

Construction is expected to begin in early 2026, with the wind farm becoming operational within three years. The developers are also exploring community ownership models that would allow local residents to share in the project's financial benefits.`,
    imageUrl: "/mock-images/articles/windfarm.jpg",
    newsNodeId: null,
    verdict: "likely_true",
    confidence: 0.84
  },
  {
    id: "art_020",
    headline: "Fact-checkers debunk claim about water fluoridation dangers",
    subheadline: "Circulating video uses outdated and misrepresented data.",
    sourceId: "src_05",
    sourceName: "FactWatch India",
    author: "Verification Team",
    publishedAt: "2025-11-22T09:00:00.000Z",
    category: "Health",
    body: `A video claiming that water fluoridation poses serious health risks has been thoroughly debunked by fact-checking organizations. The video, which has accumulated millions of views, makes several claims about fluoride that are contradicted by decades of scientific research.

The fact-check analysis found that the video cherry-picks data from old studies, misrepresents scientific consensus, and features individuals presenting themselves as experts whose credentials cannot be verified. Some statistics cited in the video have been traced to discredited sources or taken completely out of context.

"Water fluoridation at recommended levels has been extensively studied and is considered safe and effective for dental health," stated the fact-checking organization's report. "The claims in this video do not reflect current scientific understanding."

Major health organizations, including the World Health Organization, have consistently supported water fluoridation as a public health measure. While the practice is not without legitimate scientific debate about optimal levels and implementation, the extreme claims in the viral video find no support in mainstream scientific literature.

The fact-checkers note that health misinformation often exploits public unfamiliarity with how scientific research works, including the difference between correlation and causation, and the importance of peer review and replication.

Social media platforms have been notified about the misleading content, though the video continues to circulate through various channels.`,
    imageUrl: "/mock-images/articles/water-safety.jpg",
    newsNodeId: null,
    verdict: "likely_false",
    confidence: 0.91
  }
]

// Get all categories from articles
const getCategories = () => {
  const categories = [...new Set(articles.map(a => a.category))]
  return categories.sort()
}

// Get all verdicts
const getVerdicts = () => {
  return ['likely_true', 'likely_false', 'mixed', 'unclear', 'unchecked']
}

/**
 * List all articles with optional filtering and pagination
 * @param {Object} query - Filter parameters
 * @param {string} [query.category] - Filter by category
 * @param {string} [query.verdict] - Filter by verdict
 * @param {string} [query.sourceId] - Filter by source
 * @param {string} [query.q] - Search query for headline/body
 * @param {number} [query.page] - Page number (1-indexed)
 * @param {number} [query.limit] - Items per page
 * @returns {Object} - { articles, total, page, totalPages }
 */
const listAll = (query = {}) => {
  let filtered = [...articles]

  // Apply category filter
  if (query.category && query.category !== 'all') {
    filtered = filtered.filter(a => a.category.toLowerCase() === query.category.toLowerCase())
  }

  // Apply verdict filter
  if (query.verdict && query.verdict !== 'all') {
    filtered = filtered.filter(a => a.verdict === query.verdict)
  }

  // Apply source filter
  if (query.sourceId) {
    filtered = filtered.filter(a => a.sourceId === query.sourceId)
  }

  // Apply search query
  if (query.q) {
    const searchLower = query.q.toLowerCase()
    filtered = filtered.filter(a => 
      a.headline.toLowerCase().includes(searchLower) ||
      a.body.toLowerCase().includes(searchLower) ||
      a.sourceName.toLowerCase().includes(searchLower)
    )
  }

  // Sort by published date (most recent first)
  filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  // Pagination
  const page = Math.max(1, query.page || 1)
  const limit = Math.min(50, Math.max(1, query.limit || 10))
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const paginatedArticles = filtered.slice(startIndex, startIndex + limit)

  return {
    articles: paginatedArticles,
    total,
    page,
    totalPages
  }
}

/**
 * Get a single article by ID
 * @param {string} id - Article ID
 * @returns {Object|null} - Article or null if not found
 */
const getById = (id) => {
  return articles.find(a => a.id === id) || null
}

/**
 * Get trending articles for landing page
 * @param {number} [count] - Number of articles to return
 * @returns {Array} - Array of trending articles
 */
const listTrending = (count = 6) => {
  // For mock purposes, return articles sorted by confidence and recency
  const trending = [...articles]
    .sort((a, b) => {
      // Prioritize verified articles with high confidence
      const aScore = (a.verdict !== 'unchecked' ? a.confidence : 0) * 0.6 + 
                     (new Date(a.publishedAt).getTime() / Date.now()) * 0.4
      const bScore = (b.verdict !== 'unchecked' ? b.confidence : 0) * 0.6 + 
                     (new Date(b.publishedAt).getTime() / Date.now()) * 0.4
      return bScore - aScore
    })
    .slice(0, count)
  
  return trending
}

export const articlesService = {
  listAll,
  getById,
  listTrending,
  getCategories,
  getVerdicts,
  articles // Export raw data for other services
}

